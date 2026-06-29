import type { Opportunity, Profile } from "@/lib/types";

const STUDENT_FRIENDLY_CATEGORIES = ["internship", "scholarship", "hackathon", "competition", "fellowship"];

/**
 * Hard filter: removes opportunities that are flatly inapplicable to this user.
 * Returns null checks pass silently (treated as "not constrained").
 */
export function hardFilter(opportunities: Opportunity[], profile: Profile | null): Opportunity[] {
  if (!profile) return opportunities;

  return opportunities.filter((opp) => {
    // Age constraints
    const anyOpp = opp as Opportunity & { min_age?: number | null; max_age?: number | null; region?: string | null; relevant_status?: string[] };
    if (profile.age != null) {
      if (anyOpp.min_age != null && profile.age < anyOpp.min_age) return false;
      if (anyOpp.max_age != null && profile.age > anyOpp.max_age) return false;
    }

    // Region lock — only enforced if opportunity sets a region AND isn't remote
    if (anyOpp.region && !opp.remote && profile.region && anyOpp.region !== profile.region) {
      return false;
    }

    // Status relevance — only enforced if opportunity explicitly restricts itself,
    // AND only for categories where mismatch is almost certainly wrong (internships
    // for someone who is purely "employed" with no student/freelancer overlap).
    const status = profile.status ?? [];
    if (
      anyOpp.relevant_status &&
      anyOpp.relevant_status.length > 0 &&
      status.length > 0
    ) {
      const overlap = anyOpp.relevant_status.some((s) => status.includes(s));
      if (!overlap) return false;
    } else if (
      STUDENT_FRIENDLY_CATEGORIES.includes(opp.category) &&
      status.length > 0 &&
      status.every((s) => s === "employed")
    ) {
      // narrow heuristic: purely-employed users (no student/freelancer/unemployed
      // overlap) are very unlikely to want internships/scholarships/hackathons aimed
      // at students — but this only applies to fully-employed-only profiles.
      if (opp.category === "internship" || opp.category === "scholarship") return false;
    }

    return true;
  });
}

interface ScoredOpportunity {
  opportunity: Opportunity;
  score: number;
}

/**
 * Soft rank: boosts opportunities matching field/qualification/skill-level/learning
 * status, without ever removing anything. Returns the full list, reordered.
 */
export function softRank(opportunities: Opportunity[], profile: Profile | null): Opportunity[] {
  if (!profile) return opportunities;

  const scored: ScoredOpportunity[] = opportunities.map((opp) => {
    let score = 0;
    const tags = (opp.tags ?? []).map((t) => t.toLowerCase());
    const haystack = `${opp.title} ${opp.description} ${opp.org}`.toLowerCase();

    if (profile.field_of_interest) {
      const field = profile.field_of_interest.toLowerCase();
      if (haystack.includes(field) || tags.some((t) => t.includes(field))) score += 3;
    }
    if (profile.industry && haystack.includes(profile.industry.toLowerCase())) score += 2;
    if (profile.freelance_skill && haystack.includes(profile.freelance_skill.toLowerCase())) score += 2;

    if (profile.skilled_or_unskilled === "skilled" && tags.includes("advanced")) score += 1;
    if (profile.skilled_or_unskilled === "unskilled" && tags.includes("beginner")) score += 1;

    if (profile.is_currently_learning || (profile.learning_context ?? []).length > 0) {
      if (["internship", "fellowship", "hackathon"].includes(opp.category)) score += 1;
    }

    return { opportunity: opp, score };
  });

  return scored.sort((a, b) => b.score - a.score).map((s) => s.opportunity);
}

export interface PersonalizedResult {
  opportunities: Opportunity[];
  wasFiltered: boolean;
  hiddenCount: number;
}

const MIN_RESULTS_THRESHOLD = 6;

/**
 * Full pipeline: hard filter -> soft rank -> fallback if too few results.
 * If hard filtering leaves fewer than MIN_RESULTS_THRESHOLD opportunities,
 * we fall back to showing everything (soft-ranked) rather than starving
 * the user, and flag wasFiltered=false + hiddenCount so the UI can offer
 * a "show all" affordance even in that case if desired.
 */
export function personalize(
  opportunities: Opportunity[],
  profile: Profile | null,
  options: { forceShowAll?: boolean } = {}
): PersonalizedResult {
  if (options.forceShowAll || !profile) {
    return { opportunities: softRank(opportunities, profile), wasFiltered: false, hiddenCount: 0 };
  }

  const filtered = hardFilter(opportunities, profile);
  const hiddenCount = opportunities.length - filtered.length;

  if (filtered.length < MIN_RESULTS_THRESHOLD && opportunities.length >= MIN_RESULTS_THRESHOLD) {
    // Too few matches — don't starve the user. Show everything, ranked.
    return { opportunities: softRank(opportunities, profile), wasFiltered: false, hiddenCount };
  }

  return { opportunities: softRank(filtered, profile), wasFiltered: hiddenCount > 0, hiddenCount };
}
