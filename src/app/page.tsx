import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import OpportunityCard from "@/components/opportunity-card";
import SearchBar from "@/components/search-bar";
import NotificationBell from "@/components/notification-bell";
import DeadlineCountdown from "@/components/deadline-countdown";
import { personalize, buildSwipeHistory } from "@/lib/personalization";
import AppGuideGate from "@/components/app-guide/app-guide-gate";
import type { Opportunity, Profile, OpportunityCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
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
    <div className="px-4 pt-6">
      {profile?.onboarding_completed && !profile?.has_seen_app_guide && (
        <AppGuideGate shouldShow />
      )}

      <header className="flex items-start justify-between">
        <div>
          <p className="font-display text-[22px] font-bold leading-tight text-ink">
            {firstName ? (
              <>
                {greeting()}, {firstName} <span aria-hidden="true">👋</span>
              </>
            ) : (
              "AZA"
            )}
          </p>
          <p className="mt-1 text-[13px] text-text-secondary">
            {firstName ? "Let's make today count." : "Find your next big opportunity"}
          </p>
        </div>
        {user && <NotificationBell />}
      </header>

      <div className="mt-5">
        <SearchBar placeholder="Search opportunities, skills, ideas..." />
      </div>

      {isFiltering ? (
        <div className="mt-6 space-y-3">
          <Link href="/" className="text-[12.5px] font-semibold text-text-secondary">← Clear filters</Link>
          {(filteredList ?? []).length === 0 && <p className="text-[13px] text-text-secondary">No matches found.</p>}
          {filteredList?.map((opp: Opportunity) => (
            <OpportunityCard key={opp.id} opportunity={opp} isSaved={savedIds.has(opp.id)} isAuthed={!!user} />
          ))}
        </div>
      ) : (
        <>
          {profile && personalized.wasFiltered && personalized.hiddenCount > 0 && (
            <div className="mt-5 flex items-center justify-between rounded-card-sm bg-aza-light px-4 py-3">
              <p className="text-[12px] font-semibold text-aza-dark">
                Matched to your profile ({personalized.hiddenCount} hidden)
              </p>
              <Link href="/?showAll=true" className="text-[12px] font-bold text-aza-dark underline">
                Show all
              </Link>
            </div>
          )}

          <section className="mt-6">
            <QuickActions />
          </section>

          <SectionHeader title="Recommended for you" href="/discover" />
          <div className="mt-3 space-y-3">
            {personalized.opportunities.length === 0 && <EmptyState />}
            {personalized.opportunities.slice(0, 3).map((opp: Opportunity) => (
              <OpportunityCard key={opp.id} opportunity={opp} isSaved={savedIds.has(opp.id)} isAuthed={!!user} />
            ))}
          </div>

          {upcoming && (
            <section className="mt-7">
              <h2 className="text-[16px] font-semibold text-ink">Upcoming deadline</h2>
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
              <SectionHeader title="Recent activity" href="/profile" />
              <div className="mt-3 space-y-2">
                {savedRows.slice(0, 3).map((s) => (
                  <div key={s.opportunity_id} className="rounded-card-sm bg-surface px-4 py-3.5 shadow-card">
                    <p className="text-[13px] text-ink/80">
                      You saved <span className="font-semibold text-ink">{s.opportunities?.title}</span>
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-text-tertiary">{relativeTime(s.saved_at)}</p>
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

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mt-7 flex items-center justify-between">
      <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
      <Link href={href} className="text-[12.5px] font-semibold text-aza">See all</Link>
    </div>
  );
}

const QUICK_ACTIONS = [
  { href: "/discover", label: "Discover", icon: DiscoverGlyph },
  { href: "/growth/skills", label: "My Skills", icon: SkillsGlyph },
  { href: "/growth/ideas", label: "Ideas", icon: IdeasGlyph },
  { href: "/profile/cv", label: "CV Studio", icon: CvGlyph },
] as const;

function QuickActions() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-ink">Quick actions</h2>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 rounded-card bg-paper-dim py-4"
          >
            <action.icon />
            <span className="text-center text-[11px] font-medium leading-tight text-ink/80">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DiscoverGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="rgb(var(--accent))" strokeWidth="1.7" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" stroke="rgb(var(--accent))" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function SkillsGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v6M12 3l-3.5 3.5M12 3l3.5 3.5" stroke="rgb(var(--accent))" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5" y="12" width="14" height="8" rx="2" stroke="rgb(var(--accent))" strokeWidth="1.7" />
    </svg>
  );
}
function IdeasGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.2 11.1c.5.35.7.9.7 1.4v.3h5v-.3c0-.5.2-1.05.7-1.4A6 6 0 0 0 12 3Z" stroke="rgb(var(--accent))" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function CvGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M7 3.5h7L18.5 8V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="rgb(var(--accent))" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3.5V8h4.5" stroke="rgb(var(--accent))" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.5 12.5h7M8.5 15.5h7M8.5 18h4" stroke="rgb(var(--accent))" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
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
    <div className="rounded-card bg-surface p-8 text-center shadow-card">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-aza-light text-xl">✨</div>
      <p className="text-[15px] font-semibold text-ink">Nothing here yet</p>
      <p className="mt-1 text-[13px] text-text-secondary">New opportunities are added regularly — check back soon.</p>
    </div>
  );
}
