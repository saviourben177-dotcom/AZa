"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Script from "next/script";
import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";

// Google One Tap: tap once, get signed in immediately — no email typing,
// no separate consent page. Falls back to a custom-styled "Continue
// with Google" button whenever One Tap can't show (blocked by the
// browser, dismissed recently, no FedCM support in an embedded
// WebView, slow network, misconfigured origin, etc.) so sign-in is
// never a dead end.
//
// IMPORTANT: the button only ever hides itself if there is truly no
// client ID configured (nothing it could possibly do in that case).
// Every other failure — Google rejecting the origin, the script
// throwing, One Tap silently hanging — must leave a working, visible
// button behind.
//
// use_fedcm_for_prompt is OFF by default here: FedCM support is
// inconsistent across Chrome versions/Play Services states on
// Android, and a FedCM failure can throw during initialize() itself
// on some devices, which is the leading suspect for intermittent
// "isn't set up correctly" errors that don't match a real Cloud
// Console misconfiguration. Classic (non-FedCM) prompting is the
// safer default; FedCM can be re-enabled once confirmed stable.
//
// Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID to be set to a Google Cloud
// "Web application" OAuth Client ID that has this exact origin listed
// under "Authorized JavaScript origins".

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (cb?: (notification: unknown) => void) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface CredentialResponse {
  credential: string;
}

async function generateNonce() {
  const raw = crypto.randomUUID();
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(raw));
  const hashed = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { raw, hashed };
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

type Status = "idle" | "one-tap-pending" | "fallback" | "init-error" | "network-error" | "no-client-id";

export default function GoogleSignInButton({ next = "/" }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [tapError, setTapError] = useState<string | null>(null);
  const [debugDetail, setDebugDetail] = useState<string | null>(null);
  const initialized = useRef(false);
  const router = useRouter();
  const isNative = Capacitor.isNativePlatform();

  // Google blocks its sign-in flow (One Tap + GIS script) from working
  // inside any embedded WebView (disallowed_useragent policy) — this is
  // enforced on Google's side and no client-side fix here can work around
  // it. Inside the native app, skip Google Identity Services entirely and
  // do a full-page OAuth redirect instead; native code (MainActivity)
  // intercepts that redirect and routes it to the system browser, then
  // hands the signed-in session back via a custom-scheme deep link.
  const handleNativeSignIn = useCallback(async () => {
    setLoading(true);
    setTapError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "com.azatechnologies.aza://auth-callback" },
    });
    if (error) {
      setLoading(false);
      console.error("Google sign-in (native) failed:", error);
      setTapError("Couldn't sign you in. Please try again.");
      setDebugDetail(`supabase: ${error.message}`);
    }
    // On success, signInWithOAuth performs a full-page redirect itself —
    // nothing further to do here.
  }, []);

  const handleCredential = useCallback(
    async (nonce: string, response: CredentialResponse) => {
      setLoading(true);
      setTapError(null);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
        nonce,
      });
      setLoading(false);
      if (error) {
        console.error("Google sign-in failed:", error);
        setTapError("Couldn't sign you in. Please try again.");
        setDebugDetail(`supabase: ${error.message}`);
        return;
      }
      router.push(next);
      router.refresh();
    },
    [next, router]
  );

  const initGoogle = useCallback(async (): Promise<boolean> => {
    if (initialized.current) return true;
    if (!window.google) return false;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setStatus("no-client-id");
      return false;
    }

    try {
      const { raw, hashed } = await generateNonce();
      if (!window.google) return false;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: CredentialResponse) => handleCredential(raw, response),
        nonce: hashed,
        auto_select: false,
        use_fedcm_for_prompt: false,
        itp_support: true,
      });
      initialized.current = true;
      return true;
    } catch (err) {
      console.error("Google Identity Services failed to initialize:", err);
      setStatus("init-error");
      setDebugDetail(`initialize: ${describeError(err)}`);
      return false;
    }
  }, [handleCredential]);

  const handleScriptLoad = useCallback(async () => {
    if (!window.google) {
      setStatus("init-error");
      setDebugDetail("window.google missing after script load");
      return;
    }
    const ok = await initGoogle();
    if (!ok) {
      setStatus((s) => (s === "no-client-id" ? s : "fallback"));
      return;
    }
    setStatus("one-tap-pending");
    try {
      window.google.accounts.id.prompt((notification) => {
        const n = notification as {
          isNotDisplayed?: () => boolean;
          isSkippedMoment?: () => boolean;
          getNotDisplayedReason?: () => string;
          getSkippedReason?: () => string;
        };
        if (n.isNotDisplayed?.()) {
          setDebugDetail(`not displayed: ${n.getNotDisplayedReason?.() ?? "unknown"}`);
          setStatus("fallback");
        } else if (n.isSkippedMoment?.()) {
          setDebugDetail(`skipped: ${n.getSkippedReason?.() ?? "unknown"}`);
          setStatus("fallback");
        }
      });
    } catch (err) {
      console.error("Google One Tap prompt failed:", err);
      setDebugDetail(`prompt: ${describeError(err)}`);
      setStatus("fallback");
    }
  }, [initGoogle]);

  useEffect(() => {
    if (status !== "one-tap-pending") return;
    const timer = setTimeout(() => {
      setStatus((current) => (current === "one-tap-pending" ? "fallback" : current));
    }, 2500);
    return () => clearTimeout(timer);
  }, [status]);

  // Independent ground-truth check: don't rely solely on next/script's
  // onLoad/onError firing correctly. On a soft-navigated page (the tab
  // was already open and Next did a client-side route change rather
  // than a real reload), a <script> tag injected on a prior render can
  // fail to re-fire its load event, causing onError to report a false
  // "failed to load" even though the script actually loaded fine
  // earlier. Poll for window.google directly as a fallback signal.
  useEffect(() => {
    if (isNative) return; // native app never loads/polls for the GIS script
    if (initialized.current) return;
    if (window.google) {
      // Already present — script loaded before this effect ran (e.g.
      // fast cache hit). Kick off init immediately rather than waiting
      // on the Script component's onLoad, which may not fire again.
      handleScriptLoad();
      return;
    }

    let attempts = 0;
    const poll = setInterval(() => {
      attempts += 1;
      if (window.google && !initialized.current) {
        clearInterval(poll);
        handleScriptLoad();
        return;
      }
      if (attempts >= 20) {
        // ~6 seconds of polling with nothing — genuinely not there.
        clearInterval(poll);
        if (!initialized.current) {
          setStatus((s) => (s === "no-client-id" ? s : "network-error"));
          setDebugDetail("window.google still absent after polling — script genuinely did not load");
        }
      }
    }, 300);

    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNative]);

  async function handleButtonClick() {
    setTapError(null);

    if (isNative) {
      await handleNativeSignIn();
      return;
    }

    if (status === "network-error" || status === "init-error") {
      // Give a real retry instead of just an error: re-check for
      // window.google right now — the earlier failure may have been
      // transient or a stale-script false negative.
      if (window.google && !initialized.current) {
        setDebugDetail(null);
        setStatus("idle");
        await handleScriptLoad();
        return;
      }
      setTapError(
        status === "network-error"
          ? "Couldn't reach Google. Check your connection and try again."
          : "Google sign-in isn't set up correctly for this site yet. Please use email instead, or try again shortly."
      );
      return;
    }

    setLoading(true);
    if (!window.google) {
      setLoading(false);
      setTapError("Couldn't reach Google. Check your connection and try again.");
      setDebugDetail("window.google missing on click");
      return;
    }
    const ready = initialized.current || (await initGoogle());
    setLoading(false);
    if (!ready) return;

    try {
      window.google.accounts.id.prompt();
    } catch (err) {
      console.error("Google One Tap prompt failed on click:", err);
      setDebugDetail(`prompt on click: ${describeError(err)}`);
      setStatus("fallback");
    }
  }

  if (status === "no-client-id") return null;

  return (
    <>
      {!isNative && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={handleScriptLoad}
          onError={() => {
            // Don't immediately declare network-error here — the polling
            // effect above is the real source of truth and will confirm
            // (or, on a false negative, quietly correct) this within ~6s.
            setDebugDetail((d) => d ?? "Script onError fired — confirming via poll before showing an error");
          }}
        />
      )}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2.5 rounded-pill border border-line-strong bg-surface py-3.5 text-[14.5px] font-bold text-ink shadow-card transition active:scale-[0.98] disabled:opacity-60"
      >
        <Image
          src="/icons/google-icon.png"
          alt=""
          width={18}
          height={18}
          className="h-[18px] w-[18px]"
        />
        {loading ? "Connecting…" : "Continue with Google"}
      </button>
      {loading && (
        <p className="mt-2 text-center text-[12.5px] font-medium text-ink/50">
          Signing you in…
        </p>
      )}
      {tapError && (
        <p role="alert" className="mt-2 text-center text-[12.5px] font-medium text-danger">
          {tapError}
        </p>
      )}
      {/* TEMPORARY debug line — shows the real error Google/Supabase
          returned so we can pin down the exact cause instead of
          guessing. Remove once the button is confirmed working. */}
      {debugDetail && (
        <p className="mt-2 break-words text-center text-[10.5px] text-ink/35">
          debug: {debugDetail}
        </p>
      )}
    </>
  );
}
