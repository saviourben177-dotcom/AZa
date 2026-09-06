"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { zoneForState, NIGERIA_STATE_NAMES } from "@/lib/nigeria-locations";
import { COUNTRY_NAMES, type UserScope } from "@/lib/countries";

export type EmploymentStatusOption = "student" | "employed" | "self_employed" | "unemployed" | "freelancer" | "other";

export interface OnboardingData {
  full_name?: string;
  age?: number;
  status?: EmploymentStatusOption[];
  status_other?: string;
  field_of_interest?: string;
  job_title?: string;
  industry?: string;
  business_description?: string;
  freelance_skill?: string;
  disability_or_health_note?: string;
  highest_qualification?: string;
  skilled_or_unskilled?: string;
  /** "nigeria" (default) or "global" — which location step the user took. */
  scope?: UserScope;
  /** Nigerian state (or "FCT"), selected manually or resolved client-side from GPS. Only meaningful when scope is "nigeria". */
  state?: string;
  /** Country name from COUNTRY_NAMES. Only meaningful when scope is "global". */
  country?: string;
  exact_location?: string;
  is_currently_learning?: boolean;
  learning_context?: string[];
  additional_notes?: string;
}

export async function saveOnboarding(data: OnboardingData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  // Never spread scope/state/country straight onto the update — same
  // "don't trust arbitrary client text in a column other features rely
  // on" principle already applied to state below, now extended to the
  // two new location fields. (Destructuring-to-discard is the correct
  // way to get `rest`'s type properly narrowed — the lint rule below
  // doesn't recognize the underscore-prefix convention for that.)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { scope: _rawScope, state: _rawState, country: _rawCountry, ...rest } = data;

  const scope: UserScope | undefined = data.scope === "nigeria" || data.scope === "global" ? data.scope : undefined;

  // Only ever trust a state value that's actually in our controlled list —
  // never persist arbitrary client-supplied text into a column that other
  // features (Discover Nearby, Business Directory) rely on being clean.
  const state = scope !== "global" && data.state && NIGERIA_STATE_NAMES.includes(data.state) ? data.state : undefined;
  // Same principle for country: only trust a value from our controlled list.
  const country = scope === "global" && data.country && COUNTRY_NAMES.includes(data.country) ? data.country : undefined;

  // region reuses the exact same column/pattern for both paths — a zone
  // name for Nigeria, a country name for Global. One matching mechanism,
  // not two parallel ones.
  let locationFields: { scope?: UserScope; state?: string | null; region?: string } = {};
  if (state) {
    locationFields = { scope: scope ?? "nigeria", state, region: zoneForState(state) ?? undefined };
  } else if (country) {
    // A Global user's state must stay null — the DB only accepts Nigerian
    // state names there, and a stale state from a previous Nigeria-scope
    // onboarding shouldn't linger once someone switches to Global.
    locationFields = { scope: "global", state: null, region: country };
  } else if (scope) {
    // Scope chosen but no valid value yet (e.g. mid-flow) — record the
    // scope so the UI knows which picker to show on return, without
    // touching state/region until a real value is saved.
    locationFields = { scope };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      ...rest,
      ...locationFields,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
}

export async function skipOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id);
}
