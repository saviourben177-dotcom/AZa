import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { mapDbOpportunityToPrototype } from "@/lib/aza/mappers";
import { FEATURED_OPPORTUNITIES } from "@/lib/aza/featured-opportunities";
import type { ApplicationStatus } from "@/lib/types";
import DiscoverClient from "./discover-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover opportunities — Aza",
  description: "Browse verified grants, scholarships, fellowships, hackathons and internships.",
};

export default async function DiscoverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: dbOpps }, { data: featuredStatusRows }] = await Promise.all([
    supabase
      .from("opportunities")
      .select("*")
      .order("deadline", { ascending: true, nullsFirst: false })
      .limit(50),
    user
      ? supabase.from("featured_opportunity_status").select("featured_id, status").eq("user_id", user.id)
      : Promise.resolve({ data: null }),
  ]);

  const initialOpportunities = (dbOpps ?? []).map((o) => mapDbOpportunityToPrototype(o));

  const featuredStatusMap: Record<string, ApplicationStatus> = {};
  for (const row of featuredStatusRows ?? []) {
    featuredStatusMap[row.featured_id] = row.status;
  }

  return (
    <DiscoverClient
      initialOpportunities={initialOpportunities}
      featured={FEATURED_OPPORTUNITIES}
      featuredStatusMap={featuredStatusMap}
      signedIn={!!user}
    />
  );
}
