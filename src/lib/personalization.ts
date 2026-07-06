import type { Opportunity, Profile, OpportunityCategory } from "@/lib/types";

const STUDENT_FRIENDLY_CATEGORIES = ["internship", "scholarship", "hackathon", "competition", "fellowship"];

/**
 * Per-category swipe counts for a user, derived from saved_opportunities and
 * dismissed_opportunities. Built once per Discover/Home load and passed into
 * personalize() — this is what lets the ranking adapt from actual swipe
 * behavior instead of only the static onboarding profile.
 */
export interface SwipeHistory {
  saved: Partial<Record<OpportunityCategory, number>>;
  dismissed: Partial<Record<OpportunityCategory, number>>;
}

export function buildSwipeHistory(
  savedCategories: OpportunityCategory[],
  dismissedCategories: OpportunityCategory[]
): SwipeHistory {
  const saved: Partial<Record<OpportunityCategory, number>> = {};
  const dismissed: Partial<Record<OpportunityCategory, number>> = {};

  for (const cat of savedCategories) saved[cat] = (saved[cat] ?? 0) + 1;
  for (const cat of dismissedCategories) dismissed[cat] = (dismissed[cat] ?? 0) + 1;

  return { saved, dismissed };
}

/**
 * Converts raw save/dismiss counts per category into a bounded affinity score
 * per category, so a handful of early swipes don't overwhelm everything else,
 * and long-term heavy usage doesn't spiral into a single-category feed.
 *
 * Score per category is (saves - dismissals), clamped to [-4, +4], then
 * scaled by 0.75 per point when applied — deliberately smaller than the
 * explicit profile-match signals in softRank, since this is inferred
 * behavior rather than something the user told us directly.
 */
function categoryAffinityScore(category: OpportunityCategory, history?: SwipeHistory): number {
  if (!history) return 0;
  const saves = history.saved[category] ?? 0;
  const dismissals = history.dismissed[category] ?? 0;
  const raw = saves - dismissals;
  const clamped = Math.max(-4, Math.min(4, raw));
  return clamped * 0.75;
}

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
 * If swipeHistory is provided, also nudges ranking based on which categories
 * this user has actually saved vs. skipped in Discover over time.
 */
export function softRank(
  opportunities: Opportunity[],
  profile: Profile | null,
  swipeHistory?: SwipeHistory
): Opportunity[] {
  if (!profile && !swipeHistory) return opportunities;

  const scored: ScoredOpportunity[] = opportunities.map((opp) => {
    let score = 0;
    const tags = (opp.tags ?? []).map((t) => t.toLowerCase());
    const haystack = `${opp.title} ${opp.description} ${opp.org}`.toLowerCase();

    if (profile?.field_of_interest) {
      const field = profile.field_of_interest.toLowerCase();
      if (haystack.includes(field) || tags.some((t) => t.includes(field))) score += 3;
    }
    if (profile?.industry && haystack.includes(profile.industry.toLowerCase())) score += 2;
    if (profile?.freelance_skill && haystack.includes(profile.freelance_skill.toLowerCase())) score += 2;

    if (profile?.skilled_or_unskilled === "skilled" && tags.includes("advanced")) score += 1;
    if (profile?.skilled_or_unskilled === "unskilled" && tags.includes("beginner")) score += 1;

    if (profile?.is_currently_learning || (profile?.learning_context ?? []).length > 0) {
      if (["internship", "fellowship", "hackathon"].includes(opp.category)) score += 1;
    }

    score += categoryAffinityScore(opp.category, swipeHistory);

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
 *
 * swipeHistory is optional — when provided (Discover queue, Home feed for
 * logged-in users with swipe activity), category-level save/dismiss counts
 * nudge ranking on top of the static profile signals.
 */
export function personalize(
  opportunities: Opportunity[],
  profile: Profile | null,
  options: { forceShowAll?: boolean; swipeHistory?: SwipeHistory } = {}
): PersonalizedResult {
  if (options.forceShowAll || !profile) {
    return { opportunities: softRank(opportunities, profile, options.swipeHistory), wasFiltered: false, hiddenCount: 0 };
  }

  const filtered = hardFilter(opportunities, profile);
  const hiddenCount = opportunities.length - filtered.length;

  if (filtered.length < MIN_RESULTS_THRESHOLD && opportunities.length >= MIN_RESULTS_THRESHOLD) {
    // Too few matches — don't starve the user. Show everything, ranked.
    return { opportunities: softRank(opportunities, profile, options.swipeHistory), wasFiltered: false, hiddenCount };
  }

  return { opportunities: softRank(filtered, profile, options.swipeHistory), wasFiltered: hiddenCount > 0, hiddenCount };
}
