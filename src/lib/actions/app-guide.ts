"use server";

import { createClient } from "@/lib/supabase/server";

// Persists that the signed-in user has finished (or skipped) the app
// guide, so the server-rendered gate on the homepage (see src/app/page.tsx)
// stops showing it on future loads. Silently no-ops for a signed-out
// visitor — there is no profile row to update.
export async function markGuideSeen() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("profiles")
    .update({ has_seen_app_guide: true })
    .eq("id", user.id);
}
