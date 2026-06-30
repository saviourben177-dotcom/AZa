"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateBaseCv, tailorCvForOpportunity } from "@/lib/groq";
import type { Profile, Opportunity } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

/**
 * Generates (or regenerates) the user's base CV from their profile + cv_profiles data.
 * Safe to call repeatedly — always overwrites generated_content with a fresh pass
 * over the latest structured data.
 */
export async function generateMyBaseCv() {
  const { supabase, user } = await requireUser();

  const [{ data: profile }, { data: cv }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("cv_profiles").select("*").eq("user_id", user.id).single(),
  ]);

  if (!cv) throw new Error("CV profile not found — visit the CV builder first");

  const p = profile as Profile;

  const hasAnyContent =
    (cv.education?.length ?? 0) > 0 ||
    (cv.experience?.length ?? 0) > 0 ||
    (cv.certifications?.length ?? 0) > 0 ||
    (cv.skills?.length ?? 0) > 0 ||
    !!cv.summary;

  if (!hasAnyContent) {
    throw new Error("Add at least one education, experience, skill, or certification entry before generating");
  }

  const generated = await generateBaseCv({
    fullName: p?.full_name ?? null,
    fieldOfInterest: p?.field_of_interest ?? null,
    highestQualification: p?.highest_qualification ?? null,
    region: p?.region ?? null,
    summary: cv.summary,
    education: cv.education ?? [],
    experience: cv.experience ?? [],
    certifications: cv.certifications ?? [],
    skills: cv.skills ?? [],
  });

  const { error } = await supabase
    .from("cv_profiles")
    .update({ generated_content: generated, generated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/profile/cv");
  return generated;
}

/**
 * Produces a tailored version of the base CV for a specific opportunity.
 * Requires a base CV to already exist (generateMyBaseCv must run first).
 */
export async function tailorCvForOpportunityId(opportunityId: string) {
  const { supabase, user } = await requireUser();

  const [{ data: cv }, { data: opportunity }] = await Promise.all([
    supabase.from("cv_profiles").select("generated_content").eq("user_id", user.id).single(),
    supabase.from("opportunities").select("*").eq("id", opportunityId).single(),
  ]);

  if (!cv?.generated_content) {
    throw new Error("Generate your base CV first, then tailor it for specific opportunities");
  }
  if (!opportunity) throw new Error("Opportunity not found");

  const opp = opportunity as Opportunity;
  const tailored = await tailorCvForOpportunity(cv.generated_content, {
    title: opp.title,
    org: opp.org,
    description: opp.description,
    eligibility: opp.eligibility,
  });

  const { error } = await supabase
    .from("cv_tailorings")
    .upsert(
      { user_id: user.id, opportunity_id: opportunityId, content: tailored },
      { onConflict: "user_id,opportunity_id" }
    );
  if (error) throw new Error(error.message);

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/profile/cv");
  return tailored;
}

export async function getTailoredCv(opportunityId: string) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("cv_tailorings")
    .select("*")
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();
  return data;
}

export async function deleteTailoredCv(opportunityId: string) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("cv_tailorings")
    .delete()
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId);
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/profile/cv");
}
