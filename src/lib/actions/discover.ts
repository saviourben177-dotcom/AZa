"use server";

import { createClient } from "@/lib/supabase/server";
import { personalize, buildSwipeHistory } from "@/lib/personalization";
import type { Profile, OpportunityCategory } from "@/lib/types";
import { OPPORTUNITY_CATEGORY_LABELS } from "@/lib/types";

const VALID_CATEGORIES = Object.keys(OPPORTUNITY_CATEGORY_LABELS) as OpportunityCategory[];

export async function getDiscoverQueue(category?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const validCategory = VALID_CATEGORIES.includes(category as OpportunityCategory)
    ? (category as OpportunityCategory)
    : undefined;

  if (!user) {
    let query = supabase
      .from("opportunities")
      .select("*")
      .order("deadline", { ascending: true, nullsFirst: false });
    if (validCategory) query = query.eq("category", validCategory);
    const { data } = await query.limit(25);
    return { opportunities: data ?? [], isAuthed: false };
  }

  const [{ data: saved }, { data: dismissed }, { data: profile }] = await Promise.all([
    supabase.from("saved_opportunities").select("opportunity_id, opportunities(category)").eq("user_id", user.id),
    supabase.from("dismissed_opportunities").select("opportunity_id, opportunities(category)").eq("user_id", user.id),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
  ]);

  const excludeIds = new Set([
    ...(saved ?? []).map((s) => s.opportunity_id),
    ...(dismissed ?? []).map((d) => d.opportunity_id),
  ]);

  const savedCategories = (saved ?? [])
    .map((s) => (s.opportunities as unknown as { category: OpportunityCategory } | null)?.category)
    .filter((c): c is OpportunityCategory => !!c);
  const dismissedCategories = (dismissed ?? [])
    .map((d) => (d.opportunities as unknown as { category: OpportunityCategory } | null)?.category)
    .filter((c): c is OpportunityCategory => !!c);
  const swipeHistory = buildSwipeHistory(savedCategories, dismissedCategories);

  let query = supabase
    .from("opportunities")
    .select("*")
    .order("deadline", { ascending: true, nullsFirst: false });
  if (validCategory) query = query.eq("category", validCategory);
  const { data } = await query.limit(80);

  const available = (data ?? []).filter((o) => !excludeIds.has(o.id));
  const personalized = personalize(available, profile as Profile | null, { swipeHistory });

  return { opportunities: personalized.opportunities.slice(0, 25), isAuthed: true };
}

async function excludedIdsFor(supabase: Awaited<ReturnType<typeof createClient>>, userId: string | undefined) {
  if (!userId) return new Set<string>();
  const [{ data: saved }, { data: dismissed }] = await Promise.all([
    supabase.from("saved_opportunities").select("opportunity_id").eq("user_id", userId),
    supabase.from("dismissed_opportunities").select("opportunity_id").eq("user_id", userId),
  ]);
  return new Set([
    ...(saved ?? []).map((s) => s.opportunity_id),
    ...(dismissed ?? []).map((d) => d.opportunity_id),
  ]);
}

/**
 * Trending: ranked by save velocity in the last 14 days (how many people have bookmarked it
 * recently), not lifetime saves — a month-old opportunity with 3 saves last week should rank
 * above one with 20 saves from 3 months ago. Opportunities with zero recent saves are excluded
 * entirely rather than padded in at the bottom, so "Trending" never shows something nobody's
 * actually engaging with.
 */
export async function getTrendingQueue(category?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const validCategory = VALID_CATEGORIES.includes(category as OpportunityCategory)
    ? (category as OpportunityCategory)
    : undefined;

  const windowStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentSaves } = await supabase
    .from("saved_opportunities")
    .select("opportunity_id")
    .gte("saved_at", windowStart);

  const velocityMap = new Map<string, number>();
  for (const row of recentSaves ?? []) {
    velocityMap.set(row.opportunity_id, (velocityMap.get(row.opportunity_id) ?? 0) + 1);
  }

  const trendingIds = Array.from(velocityMap.keys());
  if (trendingIds.length === 0) {
    return { opportunities: [], isAuthed: !!user };
  }

  const excludeIds = await excludedIdsFor(supabase, user?.id);

  let query = supabase.from("opportunities").select("*").in("id", trendingIds);
  if (validCategory) query = query.eq("category", validCategory);
  const { data } = await query;

  const ranked = (data ?? [])
    .filter((o) => !excludeIds.has(o.id))
    .sort((a, b) => (velocityMap.get(b.id) ?? 0) - (velocityMap.get(a.id) ?? 0))
    .slice(0, 25);

  return { opportunities: ranked, isAuthed: !!user };
}

/** New: most recently added opportunities, plain reverse-chronological. */
export async function getNewQueue(category?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const validCategory = VALID_CATEGORIES.includes(category as OpportunityCategory)
    ? (category as OpportunityCategory)
    : undefined;

  const excludeIds = await excludedIdsFor(supabase, user?.id);

  let query = supabase.from("opportunities").select("*").order("created_at", { ascending: false });
  if (validCategory) query = query.eq("category", validCategory);
  const { data } = await query.limit(50);

  const opportunities = (data ?? []).filter((o) => !excludeIds.has(o.id)).slice(0, 25);
  return { opportunities, isAuthed: !!user };
}

/**
 * Nearby: matches opportunities to the signed-in user's profile.region. Both fields use a
 * small, controlled Nigerian-region vocabulary (Lagos, Middle Belt, Nationwide, etc.), not
 * free-text geocoding, so an exact string match is a real and honest signal rather than
 * approximated precision. If the user has no region set, or isn't signed in, we return an
 * explicit "needsRegion" flag instead of silently falling back to an unrelated list — the
 * caller should show a real prompt to set location, not a mislabeled generic feed.
 */
export async function getNearbyQueue(category?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { opportunities: [], isAuthed: false, needsRegion: true };
  }

  const { data: profile } = await supabase.from("profiles").select("region").eq("id", user.id).single();

  if (!profile?.region) {
    return { opportunities: [], isAuthed: true, needsRegion: true };
  }

  const validCategory = VALID_CATEGORIES.includes(category as OpportunityCategory)
    ? (category as OpportunityCategory)
    : undefined;

  const excludeIds = await excludedIdsFor(supabase, user.id);

  let query = supabase
    .from("opportunities")
    .select("*")
    .or(`region.eq.${profile.region},region.eq.Nationwide`)
    .order("deadline", { ascending: true, nullsFirst: false });
  if (validCategory) query = query.eq("category", validCategory);
  const { data } = await query.limit(50);

  const opportunities = (data ?? []).filter((o) => !excludeIds.has(o.id)).slice(0, 25);
  return { opportunities, isAuthed: true, needsRegion: false };
}

export async function undoDismiss(opportunityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("dismissed_opportunities")
    .delete()
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId);
}

export async function undoSave(opportunityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("saved_opportunities")
    .delete()
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId);
}

export async function dismissOpportunity(opportunityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("dismissed_opportunities")
    .upsert({ user_id: user.id, opportunity_id: opportunityId });
}

export async function saveOpportunityFromDiscover(opportunityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("saved_opportunities")
    .upsert({ user_id: user.id, opportunity_id: opportunityId });
}
