"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { analyzeOpportunityMatch } from "@/lib/groq";
import type { Opportunity } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export type OpportunityMatchAnalysis = {
  id: string;
  user_id: string;
  opportunity_id: string;
  match_score: number;
  matched_requirements: string[];
  missing_requirements: string[];
  summary: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Runs (or re-runs) the standalone job-fit gap analysis for an opportunity,
 * using the user's base CV (cv_profiles.generated_content). Requires a base
 * CV to already exist — mirrors the same "no-base-cv" typed-result pattern
 * used by tailorCvForOpportunityId in cv-generate.ts, for the same reason:
 * Next.js strips thrown Server Action error messages in production, so a
 * plain throw here would only show the user a useless generic error for
 * this specific, expected, recoverable case.
 *
 * NOTE ON ACCESS GATING (deliberately not implemented here):
 * Pricing and payment gateway (Paystack vs Korapay, exact amount) are not
 * yet decided. The live schema (checked via Supabase MCP list_tables on
 * project "AZA", 2026-10-25) has no access-tier/unlock column on profiles,
 * cv_tailorings, or anywhere else — so there is nothing to gate against
 * yet. This feature is fully open for now. Once an unlock/tier column
 * exists, add a check here (and mirror it in the UI component) before
 * calling analyzeOpportunityMatch — e.g.:
 *   if (!profile.has_job_match_access) return { ok: false, reason: "locked" };
 * TODO(payment): wire this once pricing/gateway is decided. Do not build
 * the actual Paystack/Korapay flow here — just the gate check.
 */
export async function analyzeOpportunityMatchForId(
  opportunityId: string
): Promise<
  | { ok: true; analysis: OpportunityMatchAnalysis }
  | { ok: false; reason: "no-base-cv" }
> {
  const { supabase, user } = await requireUser();

  const [{ data: cv }, { data: opportunity }] = await Promise.all([
    supabase.from("cv_profiles").select("generated_content").eq("user_id", user.id).single(),
    supabase.from("opportunities").select("*").eq("id", opportunityId).single(),
  ]);

  if (!cv?.generated_content) {
    return { ok: false, reason: "no-base-cv" };
  }
  if (!opportunity) throw new Error("Opportunity not found");

  const opp = opportunity as Opportunity;
  const result = await analyzeOpportunityMatch(cv.generated_content, {
    title: opp.title,
    org: opp.org,
    description: opp.description,
    eligibility: opp.eligibility,
  });

  const { data: saved, error } = await supabase
    .from("opportunity_match_analyses")
    .upsert(
      {
        user_id: user.id,
        opportunity_id: opportunityId,
        match_score: result.matchScore,
        matched_requirements: result.matchedRequirements,
        missing_requirements: result.missingRequirements,
        summary: result.summary || null,
      },
      { onConflict: "user_id,opportunity_id" }
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true, analysis: saved as OpportunityMatchAnalysis };
}

/** Fetches a previously persisted analysis, if one exists, so a user can revisit it. */
export async function getOpportunityMatchAnalysis(
  opportunityId: string
): Promise<OpportunityMatchAnalysis | null> {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("opportunity_match_analyses")
    .select("*")
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();
  return (data as OpportunityMatchAnalysis | null) ?? null;
}
