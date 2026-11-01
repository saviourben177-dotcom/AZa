"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { PushNotifications } from "@capacitor/push-notifications";
import { createClient } from "@/lib/supabase/client";

/**
 * Registers the native Android device for FCM push notifications and keeps
 * the token attached to the currently signed-in user.
 *
 * Auth can finish after the native FCM registration event, so the token is
 * retained in memory and saved again whenever Supabase auth becomes ready.
 */
export function usePushNotifications() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let latestToken: string | null = null;
    let registering = false;
    const supabase = createClient();

    async function saveToken() {
      if (cancelled || !latestToken) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.from("device_push_tokens").upsert(
        {
          user_id: user.id,
          fcm_token: latestToken,
          platform: "android",
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "fcm_token" }
      );

      if (error) {
        console.error("Failed to save push token:", error);
      }
    }

    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryAttempt = 0;
    const MAX_RETRY_DELAY_MS = 60_000;

    function scheduleRetry() {
      if (cancelled || latestToken) return;
      // Exponential backoff (2s, 4s, 8s, ... capped at 60s) so a lost
      // cold-start race is retried automatically within this same
      // session instead of only on the next app foreground. Fresh
      // installs that are opened once and never backgrounded were
      // previously stuck with no token until a manual resume.
      const delay = Math.min(2_000 * 2 ** retryAttempt, MAX_RETRY_DELAY_MS);
      retryAttempt += 1;
      retryTimer = setTimeout(() => {
        void register();
      }, delay);
    }

    async function register() {
      // A fresh install's first launch can lose this race (cold start,
      // network not ready yet, Play Services still warming up) with no
      // error the app can see. Guard against overlapping attempts; a
      // miss is retried both on next resume and via scheduleRetry below,
      // since `latestToken` stays null until a token actually lands.
      if (registering || latestToken || cancelled) return;
      registering = true;
      try {
        const permStatus = await PushNotifications.checkPermissions();

        let granted = permStatus.receive === "granted";
        if (
          permStatus.receive === "prompt" ||
          permStatus.receive === "prompt-with-rationale"
        ) {
          const req = await PushNotifications.requestPermissions();
          granted = req.receive === "granted";
        }

        if (!granted || cancelled) {
          // Permission denial is a real outcome, not a transient race —
          // don't keep retrying in a loop if the user said no.
          return;
        }

        // Android 8+ requires a notification channel for visible notifications.
        await PushNotifications.createChannel({
          id: "aza_default",
          name: "Aza Notifications",
          description: "Notifications from Aza",
          importance: 5,
          visibility: 1,
          sound: "default",
          vibration: true,
        });

        await PushNotifications.register();

        // `register()` only kicks off the native flow; the "registration"
        // listener delivers the token asynchronously (or "registrationError"
        // fires instead). If neither has landed shortly after, the native
        // call itself was lost — schedule a retry.
        setTimeout(() => {
          if (!cancelled && !latestToken) scheduleRetry();
        }, 5_000);
      } catch (err) {
        console.error("Push setup error:", err);
        if (!cancelled) scheduleRetry();
      } finally {
        registering = false;
      }
    }

    const registrationListenerPromise = PushNotifications.addListener(
      "registration",
      async (token) => {
        latestToken = token.value;
        retryAttempt = 0;
        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }
        await saveToken();
      }
    );

    const errorListenerPromise = PushNotifications.addListener(
      "registrationError",
      (err) => {
        console.error("Push registration error:", err);
        // A native registrationError means the token attempt definitely
        // failed (not just "still pending") — retry rather than waiting
        // for the next app resume.
        if (!cancelled) scheduleRetry();
      }
    );

    const authListener = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && latestToken) {
        // Defer the database write so it never runs inside Supabase's auth
        // event callback.
        setTimeout(() => {
          void saveToken();
        }, 0);
      }
    });

    void register();

    // Retry on every foreground resume until a token is actually obtained.
    // This is what covers the fresh-install case: if the very first launch
    // lost the race, the user reopening (or just backgrounding/foregrounding)
    // the app gives registration another shot instead of it being stuck
    // until a reinstall or manual app-data clear.
    const resumeListenerPromise = CapacitorApp.addListener(
      "appStateChange",
      ({ isActive }) => {
        if (isActive) void register();
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
