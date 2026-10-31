import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { opportunities as mockOpportunities, opportunityDetails as mockDetails } from "@/lib/aza-data";
import { mapDbOpportunityToPrototype } from "@/lib/aza/mappers";
import OpportunityDetailClient from "./opportunity-detail-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mock = mockOpportunities.find((x) => x.id === id);
  if (mock) {
    return {
      title: `${mock.title} — Aza`,
      description: mock.summary || mock.description || "Opportunity on Aza",
    };
  }

  const supabase = await createClient();
  const { data } = await supabase.from("opportunities").select("title, description").eq("id", id).maybeSingle();
  if (data) {
    return {
      title: `${data.title} — Aza`,
      description: data.description || "Opportunity details on Aza",
    };
  }

  return { title: "Opportunity — Aza" };
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Try DB first
  const { data: dbOpp } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  let isSaved = false;
  if (user && dbOpp) {
    const { data: savedRecord } = await supabase
      .from("saved_opportunities")
      .select("opportunity_id")
      .eq("user_id", user.id)
      .eq("opportunity_id", id)
      .maybeSingle();
    isSaved = !!savedRecord;
  }

  if (dbOpp) {
    const o = mapDbOpportunityToPrototype(dbOpp, isSaved);
    const d = {
      description: dbOpp.description || "Full details available at official application portal.",
      eligibility: dbOpp.eligibility || null,
      applyUrl: dbOpp.apply_url || null,
    };

    // Exit-intent candidates: same category, not this opportunity. Only
    // needed when not yet saved — fetched regardless of isSaved since it's
    // cheap and keeps the client component's prop shape simple; the client
    // only shows the exit-intent prompt when !saved.
    let similar: ReturnType<typeof mapDbOpportunityToPrototype>[] = [];
    if (dbOpp.category) {
      const { data: similarRows } = await supabase
        .from("opportunities")
        .select("*")
        .eq("category", dbOpp.category)
        .neq("id", id)
        .order("deadline", { ascending: true, nullsFirst: false })
        .limit(3);
      similar = (similarRows ?? []).map((row) => mapDbOpportunityToPrototype(row));
    }

    return <OpportunityDetailClient o={o} d={d} initialSaved={isSaved} similar={similar} />;
  }

  // Try mock data fallback — only reached when the id was never a real
  // row to begin with (a stale link to prototype demo content).
  const mock = mockOpportunities.find((x) => x.id === id);
  const mockD = mockDetails[id];

  if (!mock || !mockD) {
    notFound();
  }

  return (
    <OpportunityDetailClient
      o={mock}
      d={{ description: mockD.description, eligibility: mockD.eligibility, applyUrl: mockD.applyUrl }}
      initialSaved={false}
      similar={[]}
    />
  );
}
