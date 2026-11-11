"use client";

import { useEffect } from "react";

// Registers the static-asset cache + offline-fallback service worker
// (see public/sw.js). No-op on browsers without SW support, and a no-op
// safety-wise inside the Capacitor WebView too — it just caches the same
// a-za.vercel.app assets it would otherwise re-fetch every launch.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  }, []);

  return null;
}
