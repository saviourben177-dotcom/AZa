"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { zoneForState, NIGERIA_STATE_NAMES } from "@/lib/nigeria-locations";

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
  /** Nigerian state (or "FCT"), selected manually or resolved client-side from GPS. */
  state?: string;
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

  // Only ever trust a state value that's actually in our controlled list —
  // never persist arbitrary client-supplied text into a column that other
  // features (Discover Nearby, Business Directory) rely on being clean.
  const state = data.state && NIGERIA_STATE_NAMES.includes(data.state) ? data.state : undefined;
  const region = state ? (zoneForState(state) ?? undefined) : undefined;

  const { error } = await supabase
    .from("profiles")
    .update({
      ...data,
      ...(state ? { state, region } : {}),
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
