"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { releaseCurrentPushToken } from "@/lib/use-push-notifications";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await releaseCurrentPushToken();
    await supabase.auth.signOut();
    // Replace (not push) history so the back button can't return to the
    // authenticated page's stale state after signing out.
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-[13px] font-semibold text-ink/50"
    >
      Sign out
    </button>
  );
}
