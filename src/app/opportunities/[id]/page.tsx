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
      eligibility: dbOpp.eligibility || "Open to all qualified applicants.",
      applyUrl: dbOpp.apply_url || "#",
      applicants: 12,
    };
    return <OpportunityDetailClient o={o} d={d} initialSaved={isSaved} />;
  }

  // Try mock data fallback
  const mock = mockOpportunities.find((x) => x.id === id);
  const mockD = mockDetails[id];

  if (!mock || !mockD) {
    notFound();
  }

  return <OpportunityDetailClient o={mock} d={mockD} initialSaved={false} />;
}
