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
    router.push("/");
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
