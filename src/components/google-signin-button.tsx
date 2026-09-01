"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";

// Google One Tap: tap once, get signed in immediately — no email typing,
// no separate consent page. Falls back to a custom-styled "Continue
// with Google" button whenever One Tap can't show (blocked by the
// browser, dismissed recently, no FedCM support in an embedded
// WebView, slow network, etc.) so sign-in is never a dead end.
//
// Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID to be set to a Google Cloud
// "Web application" OAuth Client ID that has your Supabase project's
// domain (and localhost, for local dev) added under
// "Authorized JavaScript origins".

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
  // Google requires the ID token's nonce to be a SHA-256 hash of a
  // random value; Supabase verifies against the raw value.
  const raw = crypto.randomUUID();
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(raw));
  const hashed = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { raw, hashed };
}

type Status = "idle" | "one-tap-pending" | "fallback" | "unavailable";

export default function GoogleSignInButton({ next = "/" }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const nonceRef = useRef<{ raw: string; hashed: string } | null>(null);
  const initialized = useRef(false);
  const router = useRouter();

  const handleCredential = useCallback(
    async (nonce: string, response: CredentialResponse) => {
      setLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
        nonce,
      });
      setLoading(false);
      if (error) {
        console.error("Google sign-in failed:", error);
        setStatus("fallback");
        return;
      }
      router.push(next);
      router.refresh();
    },
    [next, router]
  );

  const initGoogle = useCallback(async () => {
    if (initialized.current || !window.google) return false;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setStatus("unavailable");
      return false;
    }

    const { raw, hashed } = await generateNonce();
    if (!window.google) return false;
    nonceRef.current = { raw, hashed };

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: CredentialResponse) => handleCredential(raw, response),
      nonce: hashed,
      auto_select: false,
      use_fedcm_for_prompt: true,
    });
    initialized.current = true;
    return true;
  }, [handleCredential]);

  // Init One Tap once the GSI script has loaded, and try the prompt.
  const handleScriptLoad = useCallback(async () => {
    if (!window.google) {
      setStatus("unavailable");
      return;
    }
    const ok = await initGoogle();
    if (!ok) {
      setStatus((s) => (s === "unavailable" ? s : "fallback"));
      return;
    }
    setStatus("one-tap-pending");
    window.google.accounts.id.prompt((notification) => {
      const n = notification as {
        isNotDisplayed?: () => boolean;
        isSkippedMoment?: () => boolean;
      };
      if (n.isNotDisplayed?.() || n.isSkippedMoment?.()) {
        setStatus("fallback");
      }
    });
  }, [initGoogle]);

  // Safety net: if One Tap hasn't resolved within 2.5s — WebViews
  // without FedCM support can just hang instead of calling back —
  // force the fallback button so the page never sits there empty.
  useEffect(() => {
    if (status !== "one-tap-pending") return;
    const timer = setTimeout(() => {
      setStatus((current) => (current === "one-tap-pending" ? "fallback" : current));
    }, 2500);
    return () => clearTimeout(timer);
  }, [status]);

  async function handleFallbackClick() {
    setLoading(true);
    if (!window.google) {
      setLoading(false);
      setStatus("unavailable");
      return;
    }
    const ready = initialized.current || (await initGoogle());
    if (!ready || !window.google) {
      setLoading(false);
      setStatus("unavailable");
      return;
    }
    setLoading(false);
    // Re-prompt One Tap on explicit tap; if it still can't display
    // (e.g. no FedCM), this simply no-ops and the button stays usable.
    window.google.accounts.id.prompt();
  }

  if (status === "unavailable") return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={() => setStatus("unavailable")}
      />
      <button
        type="button"
        onClick={handleFallbackClick}
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
    </>
  );
}
