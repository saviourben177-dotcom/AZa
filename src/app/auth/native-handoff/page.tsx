"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Reached only from the system browser after a native-app sign-in
// (see google-signin-button.tsx's handleNativeSignIn + handleCredential).
// signInWithIdToken already ran in this same browser tab, so a session
// exists here. Package its tokens into the app's custom-scheme deep
// link — MainActivity.java picks this up and calls setSession() with
// them directly, no code exchange, no PKCE verifier involved.
function NativeHandoff() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [state, setState] = useState<"working" | "done" | "error">("working");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        console.error("No session found for native handoff:", error);
        setState("error");
        return;
      }

      const { access_token, refresh_token } = data.session;
      const params = new URLSearchParams({
        access_token,
        refresh_token,
        next,
      });

      setState("done");
      window.location.href = `com.azatechnologies.aza://auth-callback?${params.toString()}`;
    })();
  }, [next]);

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

export default function NativeHandoffPage() {
  return (
    <Suspense>
      <NativeHandoff />
    </Suspense>
  );
}
