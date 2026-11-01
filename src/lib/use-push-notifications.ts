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

    async function register() {
      // A fresh install's first launch can lose this race (cold start,
      // network not ready yet, Play Services still warming up) with no
      // error the app can see. Without a retry, that single miss means
      // the device never gets a token until the user happens to clear
      // app data. Guard against overlapping attempts; real failures are
      // still retried on next resume since `latestToken` stays null.
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

        if (!granted || cancelled) return;

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
      } catch (err) {
        console.error("Push setup error:", err);
      } finally {
        registering = false;
      }
    }

    const registrationListenerPromise = PushNotifications.addListener(
      "registration",
      async (token) => {
        latestToken = token.value;
        await saveToken();
      }
    );

    const errorListenerPromise = PushNotifications.addListener(
      "registrationError",
      (err) => {
        console.error("Push registration error:", err);
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
      void registrationListenerPromise.then((handle) => handle.remove());
      void errorListenerPromise.then((handle) => handle.remove());
      void resumeListenerPromise.then((handle) => handle.remove());
      authListener.data.subscription.unsubscribe();
    };
  }, []);
}
