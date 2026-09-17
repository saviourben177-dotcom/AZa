"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Script from "next/script";
import { Capacitor } from "@capacitor/core";
import { GoogleOneTapAuth } from "capacitor-native-google-one-tap-signin";
import { createClient } from "@/lib/supabase/client";

// Web: Google Identity Services (GIS), rendered/One Tap, as before —
// no PKCE redirect, no signInWithOAuth. Runs entirely in-page; the
// credential comes back via a JS callback on the same page.
//
// Native: capacitor-native-google-one-tap-signin, which wraps
// Android's actual native Google Identity Services / Credential
// Manager SDK — a real native API call, not a WebView-hosted script
// and not a redirect through the system browser. This sidesteps the
// entire category of problem every earlier attempt kept hitting:
// GIS is blocked inside embedded WebViews by Google's own policy, and
// every redirect-based workaround we tried (Capacitor Browser plugin,
// PKCE code exchange, implicit id_token flow via Intent interception)
// ran into a different WebView/browser-boundary issue each time
// (missing native plugin registration, lost PKCE verifier,
// redirect_uri exact-match restrictions). Because this plugin calls
// Android's native SDK directly, none of those boundaries exist here.
//
// Both paths converge on the same call: supabase.auth.signInWithIdToken
// with the resulting Google ID token, so a signed-in user looks
// identical to Supabase regardless of which path got them there.
//
// Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID to be set to a Google Cloud
// "Web application" OAuth Client ID — used for BOTH platforms per this
// plugin's docs (Android also needs this Client ID, not a separate
// Android-type client, since it authenticates via Google Identity
// Services under the hood either way).

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
  const nativeInitialized = useRef(false);
  const fallbackButtonRef = useRef<HTMLDivElement>(null);
  const fallbackRendered = useRef(false);
  const router = useRouter();
  const isNative = Capacitor.isNativePlatform();

  const finishSignIn = useCallback(
    async (idToken: string, nonce: string) => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
        nonce,
      });
      if (error) {
        console.error("Google sign-in failed:", error);
        setTapError("Couldn't sign you in. Please try again.");
        setDebugDetail(`supabase: ${error.message}`);
        return false;
      }
      router.push(next);
      router.refresh();
      return true;
    },
    [next, router]
  );

  // Native path: real Android Credential Manager / One Tap SDK call,
  // no WebView, no redirect, no system browser hop.
  const handleNativeSignIn = useCallback(async () => {
    setLoading(true);
    setTapError(null);
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        setTapError("Google sign-in isn't set up correctly for this app yet.");
        setLoading(false);
        return;
      }

      if (!nativeInitialized.current) {
        await GoogleOneTapAuth.initialize({ clientId });
        nativeInitialized.current = true;
      }

      const result = await GoogleOneTapAuth.signInWithGoogleButtonFlowForNativePlatform();

      if (!result.isSuccess || !result.success) {
        const reason = result.noSuccess?.noSuccessReasonCode;
        setLoading(false);
        // TEMPORARY: previously returned silently here for
        // SIGN_IN_CANCELLED on the assumption a real user-initiated
        // cancel should stay quiet. Surfacing it now instead — some
        // underlying failures get misreported as CANCELLED by this
        // plugin's Android wrapper, and swallowing it here made a real
        // failure look like nothing happened at all.
        setTapError("Couldn't sign you in. Please try again.");
        setDebugDetail(`native: ${reason ?? "unknown"} — ${result.noSuccess?.noSuccessAdditionalInfo ?? ""}`);
        return;
      }

      const nonce = GoogleOneTapAuth.getNonce();
      const ok = await finishSignIn(result.success.idToken, nonce);
      setLoading(false);
      if (!ok) return;
    } catch (err) {
      console.error("Native Google sign-in failed:", err);
      setTapError("Couldn't sign you in. Please try again.");
      setDebugDetail(`native init/signin: ${describeError(err)}`);
      setLoading(false);
    }
  }, [finishSignIn]);

  const handleCredential = useCallback(
    async (nonce: string, response: CredentialResponse) => {
      setLoading(true);
      setTapError(null);
      const ok = await finishSignIn(response.credential, nonce);
      setLoading(false);
      void ok;
    },
    [finishSignIn]
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
    if (isNative) return;
    if (status !== "one-tap-pending") return;
    const timer = setTimeout(() => {
      setStatus((current) => (current === "one-tap-pending" ? "fallback" : current));
    }, 2500);
    return () => clearTimeout(timer);
  }, [status, isNative]);

  // One Tap can be silently skipped by the browser (common on mobile
  // Chrome — see isSkippedMoment/isNotDisplayed above) with no error and
  // no visible UI change. Re-calling accounts.id.prompt() on click just
  // retries the same floating prompt the browser already suppressed, so
  // it can look like tapping the button does nothing at all. Once we're
  // in "fallback", render Google's own official button (renderButton)
  // into a hidden container instead — it's a real click on Google's
  // iframe, not a script-triggered prompt, so it isn't subject to the
  // same silent-skip behavior. We swap our own button out for it.
  useEffect(() => {
    if (isNative) return;
    if (status !== "fallback") return;
    if (fallbackRendered.current) return;
    if (!window.google || !fallbackButtonRef.current) return;

    try {
      window.google.accounts.id.renderButton(fallbackButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 320,
      });
      fallbackRendered.current = true;
    } catch (err) {
      console.error("Google renderButton fallback failed:", err);
      setDebugDetail((d) => d ?? `renderButton fallback: ${describeError(err)}`);
    }
  }, [status, isNative]);

  useEffect(() => {
    if (isNative) return; // native app never loads/polls for the GIS script
    if (initialized.current) return;
    if (window.google) {
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
            setDebugDetail((d) => d ?? "Script onError fired — confirming via poll before showing an error");
          }}
        />
      )}
      {/* Real Google-rendered button — takes over once One Tap has been
          skipped/not-displayed. Google draws its own button inside this
          div once renderButton() succeeds; our custom button below is
          hidden at that point so there's exactly one clickable control. */}
      {!isNative && (
        <div
          ref={fallbackButtonRef}
          className={status === "fallback" ? "flex w-full justify-center" : "hidden"}
        />
      )}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={loading}
        className={`flex w-full items-center justify-center gap-2.5 rounded-pill border border-line-strong bg-surface py-3.5 text-[14.5px] font-bold text-ink shadow-card transition active:scale-[0.98] disabled:opacity-60 ${
          !isNative && status === "fallback" ? "hidden" : ""
        }`}
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
      {/* TEMPORARY debug line — remove once confirmed working. */}
      {debugDetail && (
        <p className="mt-2 break-words text-center text-[10.5px] text-ink/35">
          debug: {debugDetail}
        </p>
      )}
    </>
  );
}
