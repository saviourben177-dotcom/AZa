"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Loaded by MainActivity.java (native app WebView) after the system
// browser finished the PKCE code-for-session exchange (in
// /auth/native-google-return — see that file for why it has to run
// there, not here) and handed back a finished session via the
// custom-scheme deep link. Passes the access_token/refresh_token pair
// straight to setSession() to establish the session in THIS WebView's
// Supabase client. No code exchange happens here — that already
// happened in the system browser, using a client whose storage
// actually held the PKCE verifier. This page just adopts the
// already-finished session; nothing storage-dependent needs to work
// correctly here beyond persisting the session it's handed.
function SetSession() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");
      const next = searchParams.get("next") ?? "/";

      if (!accessToken || !refreshToken) {
        setError(true);
        return;
      }

      const supabase = createClient();
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
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
