import type { SupabaseClient } from "@supabase/supabase-js";

export type GettingStartedState = {
  profile: boolean;
  save: boolean;
  cv: boolean;
  growth: boolean;
};

/**
 * Real, server-checked getting-started progress — replaces the old
 * localStorage-only click-to-complete tracking. Each flag is a genuine fact:
 * - profile: always true by the time a user has a profiles row (home page
 *   only renders this for a signed-in user, so this is always true here;
 *   kept as an explicit field so the UI/step list stays 1:1 with the steps).
 * - save: a row exists in saved_opportunities for this user.
 * - cv: cv_profiles.generated_at is not null for this user.
 * - growth: a growth_hub_visits row exists for this user.
 */
export async function getGettingStartedState(
  supabase: SupabaseClient,
  userId: string,
): Promise<GettingStartedState> {
  const [{ count: savedCount }, { data: cvProfile }, { data: visit }] = await Promise.all([
    supabase
      .from("saved_opportunities")
      .select("opportunity_id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase.from("cv_profiles").select("generated_at").eq("user_id", userId).maybeSingle(),
    supabase.from("growth_hub_visits").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  return {
    profile: true,
    save: (savedCount ?? 0) > 0,
    cv: !!cvProfile?.generated_at,
    growth: !!visit,
  };
}
