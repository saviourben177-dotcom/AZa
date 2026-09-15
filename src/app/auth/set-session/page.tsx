"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Loaded by MainActivity.java (native app WebView) after the system
// browser finished a Google sign-in and handed control back via the
// custom-scheme deep link. Takes the access/refresh tokens straight
// from the URL and establishes the session in THIS WebView's Supabase
// client with setSession() — no code exchange, no PKCE verifier
// involved, since the tokens are already fully-formed.
function SetSession() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      const access_token = searchParams.get("access_token");
      const refresh_token = searchParams.get("refresh_token");
      const next = searchParams.get("next") ?? "/";

      if (!access_token || !refresh_token) {
        setError(true);
        return;
      }

      const supabase = createClient();
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (setSessionError) {
        console.error("setSession failed:", setSessionError);
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
