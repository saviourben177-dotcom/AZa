"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";

// Google One Tap: tap once, get signed in immediately — no email typing,
// no separate consent page. This replaces the old signInWithOAuth
// redirect flow, which always sent people to Google's full account
// chooser/consent screen.
//
// Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID to be set to a Google Cloud
// "Web application" OAuth Client ID that has your Supabase project's
// domain (and localhost, for local dev) added under
// "Authorized JavaScript origins" — see the deployment notes for setup.

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

export default function GoogleSignInButton({ next = "/" }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [fallbackNeeded, setFallbackNeeded] = useState(false);
  const buttonDivRef = useRef<HTMLDivElement>(null);
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
        setFallbackNeeded(true);
        return;
      }
      router.push(next);
      router.refresh();
    },
    [next, router]
  );

  useEffect(() => {
    if (!scriptReady || initialized.current) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google) {
      setFallbackNeeded(true);
      return;
    }

    let cancelled = false;

    (async () => {
      const { raw, hashed } = await generateNonce();
      if (cancelled || !window.google) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: CredentialResponse) => handleCredential(raw, response),
        nonce: hashed,
        auto_select: false,
        use_fedcm_for_prompt: true,
      });
      initialized.current = true;

      // Try the One Tap prompt first (the tap-and-you're-in bubble).
      window.google.accounts.id.prompt((notification) => {
        const n = notification as {
          isNotDisplayed?: () => boolean;
          isSkippedMoment?: () => boolean;
        };
        // If One Tap can't show (browser blocked it, user dismissed it
        // before, etc.), fall back to a rendered Google button so
        // sign-in is never a dead end.
        if (n.isNotDisplayed?.() || n.isSkippedMoment?.()) {
          setFallbackNeeded(true);
        }
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [scriptReady, handleCredential]);

  useEffect(() => {
    if (!fallbackNeeded || !buttonDivRef.current || !window.google) return;
    buttonDivRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(buttonDivRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      width: 343,
      text: "continue_with",
      shape: "pill",
    });
  }, [fallbackNeeded]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      {/* Google's rendered button only appears if One Tap couldn't show
          itself; otherwise this stays empty and the One Tap bubble
          floats in from Google's own UI. */}
      <div ref={buttonDivRef} className="w-full" />
      {loading && (
        <p className="mt-2 text-center text-[12.5px] font-medium text-ink/50">
          Signing you in…
        </p>
      )}
    </>
  );
}
