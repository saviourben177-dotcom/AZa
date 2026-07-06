import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import OpportunityCard from "@/components/opportunity-card";
import SearchBar from "@/components/search-bar";
import NotificationBell from "@/components/notification-bell";
import DeadlineCountdown from "@/components/deadline-countdown";
import { personalize, buildSwipeHistory } from "@/lib/personalization";
import type { Opportunity, Profile, OpportunityCategory } from "@/lib/types";

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

  let savedIds = new Set<string>();
  let savedRows: { opportunity_id: string; saved_at: string; opportunities: Opportunity }[] = [];
  let swipeHistory;
  if (user) {
    const [{ data: saved }, { data: dismissed }] = await Promise.all([
      supabase
        .from("saved_opportunities")
        .select("opportunity_id, saved_at, opportunities(*)")
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false })
        .limit(5),
      supabase
        .from("dismissed_opportunities")
        .select("opportunity_id, opportunities(category)")
        .eq("user_id", user.id),
    ]);
    savedRows = (saved ?? []) as unknown as typeof savedRows;
    savedIds = new Set(savedRows.map((s) => s.opportunity_id));

    const savedCategories = savedRows
      .map((s) => s.opportunities?.category)
      .filter((c): c is OpportunityCategory => !!c);
    const dismissedCategories = (dismissed ?? [])
      .map((d) => (d.opportunities as unknown as { category: OpportunityCategory } | null)?.category)
      .filter((c): c is OpportunityCategory => !!c);
    swipeHistory = buildSwipeHistory(savedCategories, dismissedCategories);
  }

  const personalized = personalize(allOpportunities ?? [], profile, {
    forceShowAll: showAll === "true",
    swipeHistory,
  });

  // Upcoming deadline card: most urgent saved opportunity, else most urgent
  // personalized one — always a real, live value.
  const deadlineCandidates = savedRows.length > 0
    ? savedRows.map((s) => s.opportunities).filter((o) => o?.deadline)
    : personalized.opportunities.filter((o) => o.deadline);
  const upcoming = [...deadlineCandidates].sort(
    (a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
  )[0];

  return (
    <div className="px-5 pt-7">
      <header className="flex items-start justify-between">
        <div>
          {firstName ? (
            <>
              <p className="text-[12px] font-bold uppercase tracking-wide text-aza">Welcome back</p>
              <h1 className="mt-1 font-display text-[24px] font-bold leading-tight text-ink">{greeting()}, {firstName} 👋</h1>
              <p className="mt-1 text-[13px] text-ink/55">Let&apos;s make today count.</p>
            </>
          ) : (
            <>
              <h1 className="font-display text-[28px] font-bold leading-tight text-aza">Aza</h1>
              <p className="mt-1 text-[13px] text-ink/55">Find your next big opportunity</p>
            </>
          )}
        </div>
        {user && <NotificationBell />}
      </header>

      <div className="mt-5">
        <SearchBar placeholder="Search opportunities..." />
      </div>

      {isFiltering ? (
        <div className="mt-5 space-y-4">
          <Link href="/" className="text-[12.5px] font-bold text-ink/50">← Clear filters</Link>
          {(filteredList ?? []).length === 0 && <p className="text-[13px] text-ink/50">No matches found.</p>}
          {filteredList?.map((opp: Opportunity) => (
            <OpportunityCard key={opp.id} opportunity={opp} isSaved={savedIds.has(opp.id)} isAuthed={!!user} />
          ))}
        </div>
      ) : (
        <>
          {profile && personalized.wasFiltered && personalized.hiddenCount > 0 && (
            <div className="mt-5 flex items-center justify-between rounded-card-sm bg-aza-light px-4 py-3 shadow-card">
              <p className="text-[12px] font-semibold text-aza-dark">
                Matched to your profile ({personalized.hiddenCount} hidden)
              </p>
              <Link href="/?showAll=true" className="text-[12px] font-bold text-aza-dark underline">
                Show all
              </Link>
            </div>
          )}

          <section className="mt-7">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[16px] font-bold text-ink">
                {profile ? "Recommended for you" : "Latest Opportunities"}
              </h2>
              <Link href="/discover" className="text-[12.5px] font-bold text-aza">See all</Link>
            </div>
            <div className="mt-3 space-y-4">
              {personalized.opportunities.length === 0 && <EmptyState />}
              {personalized.opportunities.slice(0, 3).map((opp: Opportunity) => (
                <OpportunityCard key={opp.id} opportunity={opp} isSaved={savedIds.has(opp.id)} isAuthed={!!user} />
              ))}
            </div>
          </section>

          {upcoming && (
            <section className="mt-7">
              <h2 className="font-display text-[16px] font-bold text-ink">Upcoming deadline</h2>
              <div className="mt-3">
                <DeadlineCountdown
                  opportunityId={upcoming.id}
                  title={upcoming.title}
                  deadline={upcoming.deadline!}
                />
              </div>
            </section>
          )}

          {user && savedRows.length > 0 && (
            <section className="mt-7">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[16px] font-bold text-ink">Recent activity</h2>
                <Link href="/profile" className="text-[12.5px] font-bold text-aza">See all</Link>
              </div>
              <div className="mt-3 space-y-2.5">
                {savedRows.slice(0, 3).map((s) => (
                  <div key={s.opportunity_id} className="rounded-card-sm border border-line-strong bg-surface px-4 py-3.5 shadow-card">
                    <p className="text-[13px] text-ink/75">
                      You saved <span className="font-bold text-ink">{s.opportunities?.title}</span>
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-ink/40">{relativeTime(s.saved_at)}</p>
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
    <div className="rounded-card border border-line-strong bg-surface p-8 text-center shadow-card">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-aza-light text-xl">✨</div>
      <p className="font-display text-[15px] font-bold text-ink">Nothing here yet</p>
      <p className="mt-1 text-[13px] text-ink/55">New opportunities are added regularly — check back soon.</p>
    </div>
  );
}
