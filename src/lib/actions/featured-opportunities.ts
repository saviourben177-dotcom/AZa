"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ApplicationStatus } from "@/lib/types";
import { getFeaturedOpportunity } from "@/lib/aza/featured-opportunities";

const VALID_STATUSES: ApplicationStatus[] = ["saved", "applied", "interviewing", "rejected", "accepted"];

// Featured opportunities (Mercor, Ethos, micro1, Outlier, Surge AI,
// Handshake AI) are a hand-maintained list, not rows in `opportunities` —
// see src/lib/aza/featured-opportunities.ts. Status is self-reported only;
// there's no API access to any of these six platforms, so nothing here
// ever syncs automatically.
export async function updateFeaturedOpportunityStatus(featuredId: string, status: ApplicationStatus) {
  if (!VALID_STATUSES.includes(status)) throw new Error("Invalid status");
  if (!getFeaturedOpportunity(featuredId)) throw new Error("Unknown featured opportunity");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("featured_opportunity_status").upsert(
    {
      user_id: user.id,
      featured_id: featuredId,
      status,
      status_updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,featured_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/discover");
  revalidatePath("/profile");
}

// Logged right before the external link opens, so a tap is recorded even
// if the person never comes back to the app. user_id is attached when
// signed in; source is always 'featured' for entries from this list.
export async function logFeaturedOpportunityClick(featuredId: string) {
  if (!getFeaturedOpportunity(featuredId)) throw new Error("Unknown featured opportunity");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("featured_opportunity_clicks").insert({
    featured_id: featuredId,
    user_id: user?.id ?? null,
    source: "featured",
  });

  // Click logging is best-effort telemetry — a failure here should never
  // block the person from reaching the external link.
  if (error) console.error("featured_opportunity_clicks insert failed:", error.message);
}
