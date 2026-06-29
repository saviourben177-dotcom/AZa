import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import OpportunityCard from "@/components/opportunity-card";

export const dynamic = "force-dynamic";

export default async function FundingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: grants } = await supabase
    .from("opportunities")
    .select("*")
    .eq("category", "grant")
    .order("deadline", { ascending: true, nullsFirst: false })
    .limit(50);

  let savedIds = new Set<string>();
  if (user) {
    const { data: saved } = await supabase.from("saved_opportunities").select("opportunity_id").eq("user_id", user.id);
    savedIds = new Set((saved ?? []).map((s) => s.opportunity_id));
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <Link href="/businesses" aria-label="Back" className="text-ink/60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[18px] font-extrabold text-ink">Funding & Grants</h1>
      </div>
      <p className="mt-2 text-[12px] text-ink/50">Pulled from Aza&apos;s opportunity listings, filtered to grants.</p>

      <div className="mt-4 space-y-3">
        {(grants ?? []).length === 0 && (
          <div className="rounded-card border border-dashed border-line bg-surface/60 p-8 text-center">
            <p className="text-[13px] text-ink/60">No grants listed yet — check back soon.</p>
          </div>
        )}
        {grants?.map((g) => <OpportunityCard key={g.id} opportunity={g} isSaved={savedIds.has(g.id)} isAuthed={!!user} />)}
      </div>
    </div>
  );
}
