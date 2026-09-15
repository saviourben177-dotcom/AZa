"use client";

import { Suspense, useEffect, useState } from "react";

// Reached in the SYSTEM BROWSER (not the app's WebView) after Google's
// implicit OAuth flow (response_type=id_token) redirects back here.
// Google returns the token in the URL FRAGMENT (#id_token=...), never
// as a query param and never sent to any server — that's the whole
// point of the fragment for this flow, so it must be read with plain
// client-side JS (window.location.hash), not searchParams or anything
// server-visible.
//
// `nonce` and `next` travel as ordinary query params instead (set as
// part of redirect_uri itself in google-signin-button.tsx), since
// those aren't secret and do need to survive being visible.
//
// Once read, hands everything to the app via the existing custom-scheme
// deep link — MainActivity.java's handleAuthCallbackIntent already
// expects access_token/refresh_token there for the set-session route,
// so this repurposes that same channel for id_token instead: see
// /auth/set-session's companion handling of id_token below.
function NativeGoogleReturn() {
  const [state, setState] = useState<"working" | "done" | "error">("working");

  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hash);

    const idToken = hashParams.get("id_token");
    const error = hashParams.get("error");
    // Google echoes back whatever was sent as `state`, unmodified, in
    // this same fragment (not as a query param) — this is how next/nonce
    // survive the round trip, since redirect_uri itself must be an exact,
    // param-free match against what's registered in Cloud Console.
    const stateParams = new URLSearchParams(hashParams.get("state") ?? "");
    const nonce = stateParams.get("nonce");
    const next = stateParams.get("next") ?? "/";

    if (error || !idToken || !nonce) {
      console.error("Native Google return missing token/nonce:", error);
      setState("error");
      return;
    }

    setState("done");
    const params = new URLSearchParams({ id_token: idToken, nonce, next });
    window.location.href = `com.azatechnologies.aza://auth-callback?${params.toString()}`;
  }, []);

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
