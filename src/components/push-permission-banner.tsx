"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { App as CapacitorApp } from "@capacitor/app";

/**
 * On Android 13+, once a user denies the notification permission, the OS
 * will not show the system prompt again — requestPermissions() just
 * silently returns "denied" forever, with no error anywhere. This is the
 * most likely explanation for the platform-wide silent push failure:
 * once denied, nothing in the app can recover without the user going to
 * system settings themselves, and until now nothing told them that.
 *
 * This banner detects that stuck state and gives clear instructions.
 * (No programmatic deep-link into system settings — none of the
 * Capacitor plugins currently installed in this project expose one, and
 * shipping an unverified native intent isn't worth the crash risk. Plain
 * instructions are a zero-risk way to unblock the same outcome.)
 */
export default function PushPermissionBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function checkStatus() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const status = await PushNotifications.checkPermissions();
      setShowBanner(status.receive === "denied");
    } catch {
      // If the check itself fails, don't show a banner we can't back up.
    }
  }

  useEffect(() => {
    void checkStatus();
    const listener = CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      // Re-check on resume: if the user went to Settings and enabled it,
      // this clears the banner on return without needing a reinstall.
      if (isActive) void checkStatus();
    });
    return () => {
      void listener.then((h) => h.remove());
    };
  }, []);

  if (!showBanner || dismissed) return null;

  return (
    <div
      role="alert"
      style={{
        padding: "10px 14px",
        background: "rgb(var(--warning, 250 204 21) / 0.15)",
        borderBottom: "1px solid rgb(var(--warning, 250 204 21) / 0.4)",
        fontSize: 13,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span>Notifications are off for Aza.</span>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid currentColor",
              background: "transparent",
              fontSize: 12,
            }}
          >
            {expanded ? "Hide" : "How to fix"}
          </button>
          <button
            onClick={() => setDismissed(true)}
            style={{ padding: "4px 8px", background: "transparent", border: "none", fontSize: 12 }}
          >
            Dismiss
          </button>
        </div>
      </div>
      {expanded && (
        <ol style={{ marginTop: 8, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Open your phone&apos;s Settings app</li>
          <li>Go to Apps → Aza → Notifications</li>
          <li>Turn Notifications on</li>
          <li>Come back here — this banner will clear once it&apos;s on</li>
        </ol>
      )}
    </div>
  );
}
