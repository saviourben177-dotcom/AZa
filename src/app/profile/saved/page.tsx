import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import OpportunityCard from "@/components/opportunity-card";
import type { Opportunity } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Mockup shows 4 sub-tabs (Opportunities / Ideas / Resources / Businesses).
 * Only Opportunities has a real table behind it — saved_ideas, saved_resources,
 * and saved_businesses don't exist (screen-mapping doc §15). Those 3 tabs are
 * rendered but disabled with a plain explanation, same honest pattern used
 * for Discover's Trending/New/Nearby tabs, rather than silently going nowhere
 * or being hidden without explanation.
 */
const TABS = [
  { key: "opportunities", label: "Opportunities", enabled: true },
  { key: "ideas", label: "Ideas", enabled: false },
  { key: "resources", label: "Resources", enabled: false },
  { key: "businesses", label: "Businesses", enabled: false },
] as const;

export default async function SavedPage() {
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
        <Link href="/profile" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-dim text-ink/70">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="text-[19px] font-bold text-ink">Saved</h1>
      </div>

      <div className="mt-4 flex rounded-pill bg-paper-dim p-1">
        {TABS.map((tab) => (
          <span
            key={tab.key}
            title={tab.enabled ? undefined : "Coming soon"}
            className={`flex-1 rounded-pill py-2 text-center text-[12.5px] font-semibold ${
              tab.enabled ? "bg-aza text-white" : "text-text-tertiary"
            }`}
          >
            {tab.label}
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {savedOpportunities.length === 0 && (
          <div className="rounded-card bg-surface p-8 text-center shadow-card">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-aza-light text-xl">🔖</div>
            <p className="text-[13px] text-text-secondary">Nothing saved yet — tap the bookmark icon on any opportunity.</p>
          </div>
        )}
        {savedOpportunities.map((opp) => (
          <OpportunityCard key={opp.id} opportunity={opp} isSaved={true} isAuthed={true} />
        ))}
      </div>
    </div>
  );
}
