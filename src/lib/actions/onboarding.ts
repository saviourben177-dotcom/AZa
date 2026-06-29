"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface OnboardingData {
  full_name?: string;
  age?: number;
  status?: string[];
  status_other?: string;
  field_of_interest?: string;
  job_title?: string;
  industry?: string;
  business_description?: string;
  freelance_skill?: string;
  disability_or_health_note?: string;
  highest_qualification?: string;
  skilled_or_unskilled?: string;
  region?: string;
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

  const { error } = await supabase
    .from("profiles")
    .update({
      ...data,
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
