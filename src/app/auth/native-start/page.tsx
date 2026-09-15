"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Reached in the SYSTEM BROWSER — MainActivity.java's
// shouldOverrideUrlLoading intercepts the WebView's initial navigation
// here (same interception it already used for accounts.google.com)
// and hands it to the system browser via Intent.ACTION_VIEW, so this
// page's JS never actually runs inside the app's WebView.
//
// This is deliberately the page that calls signInWithOAuth(), not the
// WebView. Confirmed against @supabase/auth-js source: the PKCE
// code_verifier that signInWithOAuth() generates is written to
// whatever storage that calling client instance uses, and
// exchangeCodeForSession() later reads it back from that same
// storage on whatever client instance calls it. The WebView and the
// system browser are different storage contexts on Android, so if
// signInWithOAuth() ran in the WebView, the verifier would be stuck
// there — unreachable by /auth/native-google-return, which has to run
// in the system browser to receive Google's redirect. Calling
// signInWithOAuth() here instead means the verifier is written to the
// system browser's storage from the start, where it stays reachable
// for the entire rest of the flow (including the consent-screen hop,
// which browser navigation handles as normal redirects within the
// same tab/origin — no separate context change).
function NativeStart() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const next = searchParams.get("next") ?? "/";
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/native-google-return?next=${encodeURIComponent(next)}`;

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
          skipBrowserRedirect: true,
        },
      });

      if (oauthError || !data?.url) {
        console.error("native-start: signInWithOAuth failed:", oauthError);
        setError(oauthError?.message ?? "Could not start sign-in");
        return;
      }

      // data.url is Supabase's own /auth/v1/authorize endpoint, which
      // redirects to accounts.google.com next. Navigating this SAME
      // browser tab there keeps everything in one continuous origin/
      // storage context all the way through to native-google-return.
      window.location.href = data.url;
    })();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-display text-[18px] font-bold text-ink">
        {error ? "Something went wrong" : "Opening sign-in…"}
      </h1>
      <p className="text-[13.5px] text-ink/55">
        {error ? "Please go back to the app and try again." : "One moment."}
      </p>
      {error && <p className="text-[11px] text-ink/35">debug: {error}</p>}
    </div>
  );
}

export default function NativeStartPage() {
  return (
    <Suspense>
      <NativeStart />
    </Suspense>
  );
}
