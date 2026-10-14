import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { opportunities as mockOpportunities } from "@/lib/aza-data";
import { mapDbOpportunityToPrototype } from "@/lib/aza/mappers";
import DiscoverClient from "./discover-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover opportunities — Aza",
  description: "Browse verified grants, scholarships, fellowships, hackathons and internships.",
};

export default async function DiscoverPage() {
  const supabase = await createClient();
  const { data: dbOpps } = await supabase
    .from("opportunities")
    .select("*")
    .order("deadline", { ascending: true, nullsFirst: false })
    .limit(50);

  const initialOpportunities =
    dbOpps && dbOpps.length > 0
      ? dbOpps.map((o) => mapDbOpportunityToPrototype(o))
      : mockOpportunities;

  return <DiscoverClient initialOpportunities={initialOpportunities} />;
}
