"use server";

import { createClient } from "@/lib/supabase/server";
import { personalize } from "@/lib/personalization";
import type { Profile } from "@/lib/types";

export async function getDiscoverQueue(category?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    let query = supabase
      .from("opportunities")
      .select("*")
      .order("deadline", { ascending: true, nullsFirst: false });
    if (category) query = query.eq("category", category);
    const { data } = await query.limit(25);
    return { opportunities: data ?? [], isAuthed: false };
  }

  const [{ data: saved }, { data: dismissed }, { data: profile }] = await Promise.all([
    supabase.from("saved_opportunities").select("opportunity_id").eq("user_id", user.id),
    supabase.from("dismissed_opportunities").select("opportunity_id").eq("user_id", user.id),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
  ]);

  const excludeIds = new Set([
    ...(saved ?? []).map((s) => s.opportunity_id),
    ...(dismissed ?? []).map((d) => d.opportunity_id),
  ]);

  let query = supabase
    .from("opportunities")
    .select("*")
    .order("deadline", { ascending: true, nullsFirst: false });
  if (category) query = query.eq("category", category);
  const { data } = await query.limit(80);

  const available = (data ?? []).filter((o) => !excludeIds.has(o.id));
  const personalized = personalize(available, profile as Profile | null);

  return { opportunities: personalized.opportunities.slice(0, 25), isAuthed: true };
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
