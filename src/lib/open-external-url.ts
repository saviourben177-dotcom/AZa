"use client";

import { Capacitor } from "@capacitor/core";

/**
 * Opens an external URL.
 *
 * On the web, this is just `window.open(url, "_blank")`.
 *
 * This app's capacitor.config.ts points `server.url` at the production
 * site, meaning the native app shell is a single WebView with no browser
 * "new tab" concept at all — a plain `<a target="_blank">` or
 * `window.open` call reliably does nothing there. We route through
 * `@capacitor/browser`'s in-app browser instead, which actually presents
 * a view the user can see and close.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return;

  if (Capacitor.isNativePlatform()) {
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url });
      return;
    } catch {
      // Fall through to window.open as a last resort if the plugin
      // somehow fails to load.
    }
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
