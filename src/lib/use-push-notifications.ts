"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { createClient } from "@/lib/supabase/client";

/**
 * Registers this device for push notifications (native Android only) and
 * upserts the FCM token against the current user in device_push_tokens.
 * Mirrors the Capacitor.isNativePlatform() pattern already used in
 * google-signin-button.tsx.
 *
 * Mount this once near the app root (e.g. in a client component rendered
 * from layout.tsx, alongside where auth state is already available).
 */
export function usePushNotifications() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;

    async function register() {
      const permStatus = await PushNotifications.checkPermissions();

      let granted = permStatus.receive === "granted";
      if (permStatus.receive === "prompt" || permStatus.receive === "prompt-with-rationale") {
        const req = await PushNotifications.requestPermissions();
        granted = req.receive === "granted";
      }

      if (!granted || cancelled) return;

      await PushNotifications.register();
    }

    const registrationListener = PushNotifications.addListener(
      "registration",
      async (token) => {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from("device_push_tokens").upsert(
          {
            user_id: user.id,
            fcm_token: token.value,
            platform: "android",
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "fcm_token" }
        );
      }
    );

    const errorListener = PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration error:", err);
    });

    register();

    return () => {
      cancelled = true;
      registrationListener.remove();
      errorListener.remove();
    };
  }, []);
}
