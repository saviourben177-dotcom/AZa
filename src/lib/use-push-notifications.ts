"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { PushNotifications } from "@capacitor/push-notifications";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";

/**
 * Registers the native Android device for FCM push notifications and keeps
 * the token attached to the currently signed-in user.
 *
 * Auth can finish after the native FCM registration event, so the token is
 * retained in memory and saved again whenever Supabase auth becomes ready.
 *
 * Every stage writes a row to push_registration_debug (best-effort, never
 * blocks the actual flow). Registration failures have historically been
 * completely invisible — no row saved, nothing in any Supabase log,
 * because the failure happens before any request reaches Supabase at all.
 * This is the only way to see, for a real user's real device, how far
 * registration actually gets.
 */

const APP_VERSION = "1.5.10";

// Module-level so a debug UI (see push-token-debug.tsx) can read the
// current state without plumbing props through the whole app tree.
export const pushDebugState: {
  latestToken: string | null;
  lastEvent: string | null;
  lastError: string | null;
} = {
  latestToken: null,
  lastEvent: null,
  lastError: null,
};

/**
 * Detach this device from the account that is about to sign out. The RPC
 * deletes only a row owned by the current authenticated user, so a delayed
 * sign-out can never detach a token another account has already claimed.
 */
export async function releaseCurrentPushToken(): Promise<void> {
  const token = pushDebugState.latestToken;
  if (!token) return;

  const supabase = createClient();
  const { error } = await supabase.rpc("release_push_token", {
    p_fcm_token: token,
  });

  if (error) {
    // Signing out must still be possible offline. A later sign-in will claim
    // the token for the new account atomically, so this does not create a
    // cross-account delivery path.
    console.warn("Failed to release push token before sign-out:", error.message);
    return;
  }

  pushDebugState.latestToken = null;
}

export function usePushNotifications() {
  useEffect(() => {
    const supabase = createClient();

    async function log(event: string, detail?: Json) {
      pushDebugState.lastEvent = event;
      // Json is a union (string | number | boolean | null | Json[] |
      // {[key:string]: Json}), so a plain `detail?.error` property read
      // doesn't type-check — narrow to the object case first.
      if (
        detail &&
        typeof detail === "object" &&
        !Array.isArray(detail) &&
        "error" in detail &&
        detail.error
      ) {
        pushDebugState.lastError = String(detail.error);
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Fire-and-forget: this must never throw into the caller or block
        // the actual registration flow. If the insert itself fails (RLS,
        // network), swallow it — there is no secondary place to log a
        // failure of the logger.
        await supabase.from("push_registration_debug").insert({
          user_id: user?.id ?? null,
          event,
          detail: detail ?? null,
          platform: Capacitor.getPlatform(),
          app_version: APP_VERSION,
        });
      } catch {
        // Logging must be silent on failure — nothing more to do here.
      }
    }

    if (!Capacitor.isNativePlatform()) {
      void log("skipped_not_native", { platform: Capacitor.getPlatform() });
      return;
    }

    void log("hook_mounted");

    let cancelled = false;
    let latestToken: string | null = null;
    let registering = false;

    async function saveToken() {
      if (cancelled || !latestToken) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        void log("save_skipped_no_user");
        return;
      }

      // Uses the claim_push_token RPC instead of a raw upsert. A plain
      // upsert on fcm_token conflict runs its UPDATE path through RLS's
      // USING clause against the EXISTING row's user_id — so a reinstalled
      // device, an account switch on the same device, or a token FCM
      // reissued that collided with another account's prior registration
      // gets rejected with a 403 if that token was last owned by someone
      // else. The RPC performs that reassignment deliberately and securely
      // server-side (security definer, scoped to auth.uid() only — it can
      // never claim a token on behalf of anyone but the caller).
      try {
        const { error } = await supabase.rpc("claim_push_token", {
          p_fcm_token: latestToken,
          p_platform: "android",
        });

        if (error) {
          console.error("Failed to save push token:", error.message, error);
          void log("save_failed", { error: error.message, code: error.code });
        } else {
          void log("save_succeeded");
        }
      } catch (err) {
        // A thrown error here (network failure, request timeout) means the
        // request never reached Supabase at all — distinct from, and just
        // as important to see as, an RPC error response. This is the case
        // most likely to have been silently happening with zero trace.
        console.error("Push token save request failed:", err);
        void log("save_threw", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryAttempt = 0;
    let retryDisabled = false;
    const MAX_RETRY_ATTEMPTS = 6;
    const MAX_RETRY_DELAY_MS = 60_000;

    // FCM registration errors that mean "stop hammering, this will not
    // resolve on its own retry" — most importantly the registration-quota
    // errors (seen as TOO_MANY_REGISTRATIONS / QUOTA_EXCEEDED in device
    // logs). Retrying on these just adds to the quota exhaustion instead
    // of recovering from it.
    const TERMINAL_ERROR_PATTERNS = [
      "TOO_MANY_REGISTRATIONS",
      "QUOTA_EXCEEDED",
      "INVALID_SENDER",
      "NOT_REGISTERED",
    ];

    function isTerminalError(message: string | undefined | null): boolean {
      if (!message) return false;
      return TERMINAL_ERROR_PATTERNS.some((pattern) =>
        message.toUpperCase().includes(pattern)
      );
    }

    function scheduleRetry(errorMessage?: string | null) {
      if (cancelled || latestToken || retryDisabled) return;

      if (isTerminalError(errorMessage)) {
        retryDisabled = true;
        void log("retry_disabled_terminal_error", { error: errorMessage });
        return;
      }

      if (retryAttempt >= MAX_RETRY_ATTEMPTS) {
        retryDisabled = true;
        void log("retry_disabled_max_attempts", { attempts: retryAttempt });
        return;
      }

      const delay = Math.min(2_000 * 2 ** retryAttempt, MAX_RETRY_DELAY_MS);
      retryAttempt += 1;
      void log("retry_scheduled", { attempt: retryAttempt, delay_ms: delay });
      retryTimer = setTimeout(() => {
        void register();
      }, delay);
    }

    async function register() {
      if (registering || latestToken || cancelled || retryDisabled) {
        void log("register_skipped", {
          registering,
          has_token: !!latestToken,
          cancelled,
          retryDisabled,
        });
        return;
      }
      registering = true;
      void log("register_started");
      try {
        const permStatus = await PushNotifications.checkPermissions();
        void log("permission_checked", { receive: permStatus.receive });

        let granted = permStatus.receive === "granted";
        if (
          permStatus.receive === "prompt" ||
          permStatus.receive === "prompt-with-rationale"
        ) {
          const req = await PushNotifications.requestPermissions();
          granted = req.receive === "granted";
          void log("permission_requested", { result: req.receive });
        }

        if (!granted || cancelled) {
          // Permission denial is a real outcome, not a transient race —
          // don't keep retrying in a loop if the user said no. This is a
          // strong candidate for silent platform-wide failure: a denied
          // or never-prompted permission means register() exits here on
          // every single launch, forever, with nothing visible to anyone
          // but this log row.
          void log("permission_not_granted", { receive: permStatus.receive });
          return;
        }

        await PushNotifications.createChannel({
          id: "aza_default",
          name: "Aza Notifications",
          description: "Notifications from Aza",
          importance: 5,
          visibility: 1,
          sound: "default",
          vibration: true,
        });
        void log("channel_created");

        await PushNotifications.register();
        void log("native_register_called");

        // `register()` only kicks off the native flow; the "registration"
        // listener delivers the token asynchronously (or "registrationError"
        // fires instead). If neither has landed shortly after, the native
        // call itself was lost — schedule a retry.
        setTimeout(() => {
          if (!cancelled && !latestToken) {
            void log("registration_listener_timeout");
            scheduleRetry();
          }
        }, 5_000);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Push setup error:", err);
        void log("register_threw", { error: message });
        if (!cancelled) scheduleRetry(message);
      } finally {
        registering = false;
      }
    }

    const registrationListenerPromise = PushNotifications.addListener(
      "registration",
      async (token) => {
        latestToken = token.value;
        pushDebugState.latestToken = token.value;
        retryAttempt = 0;
        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }
        void log("token_received", { token_prefix: token.value.slice(0, 12) });
        await saveToken();
      }
    );

    const errorListenerPromise = PushNotifications.addListener(
      "registrationError",
      (err) => {
        const serialized = JSON.stringify(err);
        console.error("Push registration error:", err);
        void log("registration_error_event", { error: serialized });
        if (!cancelled) scheduleRetry(err?.error ?? serialized);
      }
    );

    const authListener = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && latestToken) {
        void log("auth_state_changed_with_token", { event: _event });
        setTimeout(() => {
          void saveToken();
        }, 0);
      } else if (session) {
        void log("auth_state_changed_no_token_yet", { event: _event });
      }
    });

    void register();

    const resumeListenerPromise = CapacitorApp.addListener(
      "appStateChange",
      ({ isActive }) => {
        if (isActive) {
          void log("app_resumed");
          void register();
        }
      }
    );

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      void registrationListenerPromise.then((handle) => handle.remove());
      void errorListenerPromise.then((handle) => handle.remove());
      void resumeListenerPromise.then((handle) => handle.remove());
      authListener.data.subscription.unsubscribe();
    };
  }, []);
}
