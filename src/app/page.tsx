import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import OpportunityCard from "@/components/opportunity-card";
import SearchBar from "@/components/search-bar";
import NotificationBell from "@/components/notification-bell";
import DeadlineCountdown from "@/components/deadline-countdown";
import { personalize } from "@/lib/personalization";
import type { Opportunity, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; showAll?: string }>;
}) {
  const { category, q, showAll } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }
  const firstName = profile?.full_name?.split(" ")[0] ?? null;

  const isFiltering = !!category || !!q;

  let listQuery = supabase.from("opportunities").select("*");
  if (category) listQuery = listQuery.eq("category", category);
  if (q) {
    const term = q.replace(/[%,]/g, "");
    listQuery = listQuery.or(`title.ilike.%${term}%,org.ilike.%${term}%,description.ilike.%${term}%`);
  }
  listQuery = listQuery.order("deadline", { ascending: true, nullsFirst: false });
  const { data: filteredList } = await listQuery.limit(50);

  const { data: allOpportunities } = await supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const personalized = personalize(allOpportunities ?? [], profile, {
    forceShowAll: showAll === "true",
  });

  let savedIds = new Set<string>();
  let savedRows: { opportunity_id: string; saved_at: string; opportunities: Opportunity }[] = [];
  if (user) {
    const { data: saved } = await supabase
      .from("saved_opportunities")
      .select("opportunity_id, saved_at, opportunities(*)")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false })
      .limit(5);
    savedRows = (saved ?? []) as unknown as typeof savedRows;
    savedIds = new Set(savedRows.map((s) => s.opportunity_id));
  }

  // Upcoming deadline card: most urgent saved opportunity, else most urgent
  // personalized one — always a real, live value.
  const deadlineCandidates = savedRows.length > 0
    ? savedRows.map((s) => s.opportunities).filter((o) => o?.deadline)
    : personalized.opportunities.filter((o) => o.deadline);
  const upcoming = [...deadlineCandidates].sort(
    (a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
  )[0];

  return (
    <div className="px-4 pt-6">
      <header className="flex items-start justify-between">
        <div>
          {firstName ? (
            <>
              <h1 className="font-display text-[19px] font-extrabold text-ink">{greeting()}, {firstName} 👋</h1>
              <p className="mt-0.5 text-[12.5px] text-ink/60">Let&apos;s make today count.</p>
            </>
          ) : (
            <>
              <h1 className="font-display text-[22px] font-extrabold text-aza">Aza</h1>
              <p className="mt-0.5 text-[12.5px] text-ink/60">Find your next big opportunity</p>
            </>
          )}
        </div>
        {user && <NotificationBell />}
      </header>

      <div className="mt-4">
        <SearchBar placeholder="Search opportunities..." />
      </div>

      {isFiltering ? (
        <div className="mt-4 space-y-3">
          <Link href="/" className="text-[12.5px] font-semibold text-ink/50">← Clear filters</Link>
          {(filteredList ?? []).length === 0 && <p className="text-[13px] text-ink/50">No matches found.</p>}
          {filteredList?.map((opp: Opportunity) => (
            <OpportunityCard key={opp.id} opportunity={opp} isSaved={savedIds.has(opp.id)} isAuthed={!!user} />
          ))}
        </div>
      ) : (
        <>
          {profile && personalized.wasFiltered && personalized.hiddenCount > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-card bg-aza-light px-3.5 py-2.5">
              <p className="text-[12px] font-medium text-aza-dark">
                Showing matches based on your profile ({personalized.hiddenCount} hidden)
              </p>
              <Link href="/?showAll=true" className="text-[12px] font-bold text-aza-dark underline">
                Show all
              </Link>
            </div>
          )}

          <section className="mt-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[14px] font-bold text-ink">
                {profile ? "Recommended for you" : "Latest Opportunities"}
              </h2>
              <Link href="/discover" className="text-[12px] font-semibold text-aza">See all</Link>
            </div>
            <div className="mt-2.5 space-y-3">
              {personalized.opportunities.length === 0 && <EmptyState />}
              {personalized.opportunities.slice(0, 3).map((opp: Opportunity) => (
                <OpportunityCard key={opp.id} opportunity={opp} isSaved={savedIds.has(opp.id)} isAuthed={!!user} />
              ))}
            </div>
          </section>

          {upcoming && (
            <section className="mt-6">
              <h2 className="font-display text-[14px] font-bold text-ink">Upcoming deadline</h2>
              <div className="mt-2.5">
                <DeadlineCountdown
                  opportunityId={upcoming.id}
                  title={upcoming.title}
                  deadline={upcoming.deadline!}
                />
              </div>
            </section>
          )}

          {user && savedRows.length > 0 && (
            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[14px] font-bold text-ink">Recent activity</h2>
                <Link href="/profile" className="text-[12px] font-semibold text-aza">See all</Link>
              </div>
              <div className="mt-2.5 space-y-2">
                {savedRows.slice(0, 3).map((s) => (
                  <div key={s.opportunity_id} className="rounded-card border border-line bg-surface px-3.5 py-3">
                    <p className="text-[12.5px] text-ink/75">
                      You saved <span className="font-semibold text-ink">{s.opportunities?.title}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink/40">{relativeTime(s.saved_at)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function EmptyState() {
  return (
    <div className="rounded-card border border-dashed border-line bg-surface/60 p-8 text-center">
      <p className="font-display text-[15px] font-bold text-ink">Nothing here yet</p>
      <p className="mt-1 text-[13px] text-ink/60">New opportunities are added regularly — check back soon.</p>
    </div>
  );
}
