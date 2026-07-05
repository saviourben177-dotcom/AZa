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
    <div className="px-5 pt-7">
      <div className="flex items-center gap-3">
        <Link href="/businesses" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[19px] font-bold text-ink">Funding & Grants</h1>
      </div>
      <p className="mt-2 text-[12.5px] text-ink/50">Pulled from Aza&apos;s opportunity listings, filtered to grants.</p>

      <div className="mt-5 space-y-4">
        {(grants ?? []).length === 0 && (
          <div className="rounded-card border border-line-strong bg-surface p-8 text-center shadow-card">
            <p className="text-[13px] text-ink/55">No grants listed yet — check back soon.</p>
          </div>
        )}
        {grants?.map((g) => <OpportunityCard key={g.id} opportunity={g} isSaved={savedIds.has(g.id)} isAuthed={!!user} />)}
      </div>
    </div>
  );
}
