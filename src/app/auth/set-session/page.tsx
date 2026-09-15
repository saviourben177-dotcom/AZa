"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Loaded by MainActivity.java (native app WebView) after the system
// browser finished Google's implicit-flow sign-in and handed back an
// id_token via the custom-scheme deep link. Passes that id_token
// (plus the original nonce, required for verification) straight to
// signInWithIdToken() to establish the session in THIS WebView's
// Supabase client — same mechanism the web button uses via GIS, just
// fed a token that arrived through the system-browser round trip
// instead of a same-page JS callback.
function SetSession() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      const idToken = searchParams.get("id_token");
      const nonce = searchParams.get("nonce");
      const next = searchParams.get("next") ?? "/";

      if (!idToken || !nonce) {
        setError(true);
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
        nonce,
      });

      if (signInError) {
        console.error("signInWithIdToken failed:", signInError);
        setError(true);
        return;
      }

      router.replace(next);
      router.refresh();
    })();
  }, [searchParams, router]);

  if (!error) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-display text-[18px] font-bold text-ink">Sign-in failed</h1>
      <p className="text-[13.5px] text-ink/55">
        Please go back and try Continue with Google again, or use email instead.
      </p>
    </div>
  );
}

export default function SetSessionPage() {
  return (
    <Suspense>
      <SetSession />
    </Suspense>
  );
}
