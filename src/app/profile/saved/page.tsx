import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import OpportunityCard from "@/components/opportunity-card";
import type { Opportunity } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SavedOpportunitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile/saved");

  const { data: saved } = await supabase
    .from("saved_opportunities")
    .select("opportunity_id, saved_at, opportunities(*)")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false });

  const savedOpportunities = (saved ?? []).map((s) => s.opportunities).filter(Boolean) as unknown as Opportunity[];

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <Link href="/profile" aria-label="Back" className="text-ink/60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[18px] font-extrabold text-ink">Saved Opportunities</h1>
      </div>

      <div className="mt-4 space-y-3">
        {savedOpportunities.length === 0 && <p className="text-[13px] text-ink/50">Nothing saved yet.</p>}
        {savedOpportunities.map((opp) => (
          <OpportunityCard key={opp.id} opportunity={opp} isSaved={true} isAuthed={true} />
        ))}
      </div>
    </div>
  );
}
