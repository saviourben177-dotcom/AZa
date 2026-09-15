"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Reached in the SYSTEM BROWSER — still the same browser tab that
// /auth/native-start opened, after Supabase's authorize endpoint and
// Google's consent screen finish and redirect back here with `?code=`.
//
// This page's createClient() call can successfully exchange that code:
// the PKCE verifier signInWithOAuth() wrote (in native-start, in this
// same tab/origin) is sitting in this browser's storage, reachable by
// any client instance created here. That's the entire fix — nothing
// about exchangeCodeForSession() itself changed; what changed is that
// signInWithOAuth() and exchangeCodeForSession() now both run in the
// system browser instead of split across the WebView and the browser.
function NativeGoogleReturn() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const code = searchParams.get("code");
      const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
      const next = searchParams.get("next") ?? "/";

      if (oauthError) {
        console.error("Native Google return: OAuth error from provider:", oauthError);
        setErrorDetail(oauthError);
        setState("error");
        return;
      }
      if (!code) {
        console.error("Native Google return: missing code param");
        setErrorDetail("missing code");
        setState("error");
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data?.session) {
        console.error("exchangeCodeForSession failed:", error);
        setErrorDetail(error?.message ?? "no session returned");
        setState("error");
        return;
      }

      setState("done");
      // Hand the FINISHED session (tokens, not a code) back to the app
      // via the existing custom-scheme deep link. MainActivity.java's
      // handleAuthCallbackIntent reads access_token/refresh_token here
      // and loads /auth/set-session in the WebView with them, which
      // just calls setSession() — no exchange, no verifier, nothing
      // storage-dependent left to do on the WebView side.
      const params = new URLSearchParams({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        next,
      });
      window.location.href = `com.azatechnologies.aza://auth-callback?${params.toString()}`;
    })();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-display text-[18px] font-bold text-ink">
        {state === "error" ? "Something went wrong" : "Signing you in…"}
      </h1>
      <p className="text-[13.5px] text-ink/55">
        {state === "error"
          ? "Please go back to the app and try again."
          : "You can return to the Aza app now."}
      </p>
      {state === "error" && errorDetail && (
        <p className="text-[11px] text-ink/35">debug: {errorDetail}</p>
      )}
    </div>
  );
}

export default function NativeGoogleReturnPage() {
  return (
    <Suspense>
      <NativeGoogleReturn />
    </Suspense>
  );
}
