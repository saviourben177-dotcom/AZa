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
    <div className="px-5 pt-7">
      <div className="flex items-center gap-3">
        <Link href="/profile" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[19px] font-bold text-ink">Saved Opportunities</h1>
      </div>

      <div className="mt-5 space-y-4">
        {savedOpportunities.length === 0 && (
          <div className="rounded-card border border-line-strong bg-surface p-8 text-center shadow-card">
            <p className="text-[13px] text-ink/55">Nothing saved yet.</p>
          </div>
        )}
        {savedOpportunities.map((opp) => (
          <OpportunityCard key={opp.id} opportunity={opp} isSaved={true} isAuthed={true} />
        ))}
      </div>
    </div>
  );
}
