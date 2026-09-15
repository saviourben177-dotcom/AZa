"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Reached in the SYSTEM BROWSER after Supabase/Google redirect back with ?code=.
// createBrowserClient() uses Supabase Auth URL detection, so the PKCE code is
// exchanged automatically during client initialization. Do NOT exchange it a
// second time here; that would race/duplicate the one-time code exchange.
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
      // createClient() automatically detects ?code= and completes the PKCE
      // exchange. getSession() waits for that initialization to finish, so
      // this reads the resulting session without consuming the code again.
      const { data, error } = await supabase.auth.getSession();

      if (error || !data?.session) {
        console.error("Native Google return: session initialization failed:", error);
        setErrorDetail(error?.message ?? "no session returned");
        setState("error");
        return;
      }

      setState("done");
      // Hand the FINISHED session back to the app via the existing custom-scheme
      // deep link. MainActivity.java loads /auth/set-session in the WebView,
      // where setSession() adopts the already-finished session.
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
