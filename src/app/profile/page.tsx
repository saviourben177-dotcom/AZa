import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ReplayGuideRow from "@/components/app-guide/replay-guide-row";
import OpportunityCard from "@/components/opportunity-card";
import BusinessCard from "@/components/business-card";
import SaveIdeaButton from "@/components/save-idea-button";
import SaveResourceButton from "@/components/save-resource-button";
import SignOutButton from "@/components/sign-out-button";
import ThemeToggle from "@/components/theme-toggle";
import type { Opportunity, Idea, SkillResource, Business, ApplicationStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type ProfileTab = "overview" | "saved";
type SavedCategory = "opportunities" | "ideas" | "resources" | "businesses";

const PROFILE_TABS: { key: ProfileTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "saved", label: "Saved" },
];

const SAVED_CATEGORIES: { key: SavedCategory; label: string }[] = [
  { key: "opportunities", label: "Opportunities" },
  { key: "ideas", label: "Ideas" },
  { key: "resources", label: "Resources" },
  { key: "businesses", label: "Businesses" },
];

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; category?: string; q?: string }>;
}) {
  const { tab: rawTab, category: rawCategory, q } = await searchParams;
  const tab: ProfileTab = rawTab === "saved" ? "saved" : "overview";
  const category: SavedCategory = (SAVED_CATEGORIES.some((c) => c.key === rawCategory)
    ? rawCategory
    : "opportunities") as SavedCategory;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="px-5 pt-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-aza-light text-3xl shadow-card">
          👋
        </div>
        <h1 className="mt-5 font-display text-[21px] font-bold text-ink">You&apos;re not logged in</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink/55">
          Log in to save opportunities and manage your account.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block w-full rounded-pill bg-aza px-6 py-3.5 text-[14.5px] font-bold text-white shadow-glow-accent"
        >
          Log in
        </Link>
        <div className="mt-10 text-left"><ThemeToggle /></div>
      </div>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const avatarUrl = profile?.avatar_url as string | null | undefined;

  const [{ count: savedOppCount }, { count: ideaCount }, { count: skillCount }, { count: applicationCount }] = await Promise.all([
    supabase.from("saved_opportunities").select("opportunity_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("ideas").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("user_skills").select("skill_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("saved_opportunities")
      .select("opportunity_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("status", "saved"),
  ]);

  return (
    <div className="px-5 pt-7">
      <p className="text-[12px] font-bold uppercase tracking-wide text-aza">Profile</p>

      <div className="mt-4 flex gap-2">
        {PROFILE_TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "overview" ? "/profile" : "/profile?tab=saved"}
            className={`flex-1 rounded-pill border py-2.5 text-center text-[13.5px] font-bold ${
              tab === t.key ? "border-aza bg-aza text-white shadow-glow-accent" : "border-line-strong bg-surface text-ink/60"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "overview" ? (
        <OverviewTab
          user={{ email: user.email ?? "" }}
          profile={profile}
          avatarUrl={avatarUrl}
          savedOppCount={savedOppCount ?? 0}
          applicationCount={applicationCount ?? 0}
          ideaCount={ideaCount ?? 0}
          skillCount={skillCount ?? 0}
        />
      ) : (
        <SavedTab userId={user.id} category={category} query={q} />
      )}
    </div>
  );
}

function OverviewTab({
  user,
  profile,
  avatarUrl,
  savedOppCount,
  applicationCount,
  ideaCount,
  skillCount,
}: {
  user: { email: string };
  profile: { full_name: string | null; role: string } | null;
  avatarUrl: string | null | undefined;
  savedOppCount: number;
  applicationCount: number;
  ideaCount: number;
  skillCount: number;
}) {
  return (
    <>
      <div className="mt-5 flex items-center gap-4 rounded-card border border-line-strong bg-surface p-4 shadow-card">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-aza/30" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-aza-light font-display text-xl font-bold text-aza ring-2 ring-aza/20">
            {(profile?.full_name ?? user.email ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[16px] font-bold text-ink">{profile?.full_name ?? "Aza user"}</p>
          <p className="truncate text-[12.5px] text-ink/50">{user.email}</p>
          {profile?.role !== "user" && (
            <span className="mt-1.5 inline-block rounded-pill bg-aza-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-aza">
              {profile?.role}
            </span>
          )}
        </div>
        <Link
          href="/profile/edit"
          className="shrink-0 rounded-pill border border-line-strong px-3.5 py-1.5 text-[12px] font-bold text-ink/70"
        >
          Edit
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-4 divide-x divide-line rounded-card border border-line-strong bg-surface shadow-card">
        <StatBox label="Saved" value={savedOppCount} />
        <StatBox label="Applied" value={applicationCount} />
        <StatBox label="Ideas" value={ideaCount} />
        <StatBox label="Skills" value={skillCount} />
      </div>

      {(profile?.role === "curator" || profile?.role === "admin") && (
        <Link href="/curator" className="mt-4 block rounded-card bg-ink px-4 py-3.5 text-center text-[14px] font-bold text-paper shadow-card">
          Open curator dashboard →
        </Link>
      )}

      <section className="mt-7 space-y-2.5">
        <ProfileLinkRow href="/profile/cv" label="CV Builder" />
        <ProfileLinkRow href="/growth/ideas?filter=mine" label="My Ideas" />
        <ProfileLinkRow href="/businesses/team-finder/my-requests" label="My Join Requests" />
        <ProfileLinkRow href="/growth/skills" label="My Skills" />
        <ProfileLinkRow href="/businesses/marketplace" label="My Listings" />
      </section>

      <section className="mt-7 space-y-2.5">
        <ThemeToggle />
        <ReplayGuideRow />
        <ProfileLinkRow href="/help" label="Help & Support" />
        <ProfileLinkRow href="/about" label="About Aza" />
        <ProfileLinkRow href="/profile/settings" label="Settings" />
      </section>

      <div className="mt-7"><SignOutButton /></div>
    </>
  );
}

async function SavedTab({ userId, category, query }: { userId: string; category: SavedCategory; query?: string }) {
  return (
    <>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SAVED_CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={`/profile?tab=saved&category=${c.key}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            className={`shrink-0 rounded-pill border px-4 py-2 text-[13px] font-bold ${
              category === c.key ? "border-aza bg-aza text-white shadow-glow-accent" : "border-line-strong bg-surface text-ink/60"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <form action="/profile" method="get" className="mt-4 flex items-center gap-2.5 rounded-card-sm border border-line-strong bg-surface px-4 py-3 shadow-card">
        <input type="hidden" name="tab" value="saved" />
        <input type="hidden" name="category" value={category} />
        <SearchIcon />
        <input
          name="q"
          defaultValue={query ?? ""}
          placeholder={`Search saved ${category}...`}
          className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none"
        />
        {query && (
          <Link href={`/profile?tab=saved&category=${category}`} aria-label="Clear search" className="text-ink/35">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
        )}
      </form>

      <div className="mt-4">
        {category === "opportunities" && <SavedOpportunities userId={userId} query={query} />}
        {category === "ideas" && <SavedIdeas userId={userId} query={query} />}
        {category === "resources" && <SavedResources userId={userId} query={query} />}
        {category === "businesses" && <SavedBusinesses userId={userId} query={query} />}
      </div>
    </>
  );
}

async function SavedOpportunities({ userId, query }: { userId: string; query?: string }) {
  const supabase = await createClient();
  const { data: saved } = await supabase
    .from("saved_opportunities")
    .select("opportunity_id, saved_at, status, opportunities(*)")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  let rows = (saved ?? []).filter((s) => s.opportunities);

  if (query?.trim()) {
    const q = query.trim().toLowerCase();
    rows = rows.filter((r) => {
      const o = r.opportunities as unknown as { title: string; org: string };
      return o.title.toLowerCase().includes(q) || o.org.toLowerCase().includes(q);
    });
  }

  if (rows.length === 0) {
    return <EmptyState label={query ? `No saved opportunities match "${query}".` : "No saved opportunities yet."} />;
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <OpportunityCard
          key={row.opportunity_id}
          opportunity={row.opportunities as unknown as Opportunity}
          isSaved={true}
          isAuthed={true}
          applicationStatus={row.status as ApplicationStatus}
        />
      ))}
    </div>
  );
}

async function SavedIdeas({ userId, query }: { userId: string; query?: string }) {
  const supabase = await createClient();
  const { data: saved } = await supabase
    .from("saved_ideas")
    .select("idea_id, saved_at, ideas(*)")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  let items = (saved ?? []).map((s) => s.ideas).filter(Boolean) as unknown as Idea[];

  if (query?.trim()) {
    const q = query.trim().toLowerCase();
    items = items.filter((i) => i.title.toLowerCase().includes(q));
  }

  if (items.length === 0) {
    return <EmptyState label={query ? `No saved ideas match "${query}".` : "No saved ideas yet."} />;
  }

  return (
    <div className="space-y-3">
      {items.map((idea) => (
        <Link key={idea.id} href={`/growth/ideas/${idea.id}`} className="block rounded-card-sm border border-line-strong bg-surface p-4 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-ink">{idea.title}</p>
              {idea.category && <p className="mt-1 text-[11px] font-semibold text-ink/45">{idea.category}</p>}
            </div>
            <SaveIdeaButton ideaId={idea.id} initialSaved={true} isAuthed={true} />
          </div>
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink/65">{idea.description}</p>
        </Link>
      ))}
    </div>
  );
}

async function SavedResources({ userId, query }: { userId: string; query?: string }) {
  const supabase = await createClient();
  const { data: saved } = await supabase
    .from("saved_resources")
    .select("resource_id, saved_at, skill_resources(*, skills(name))")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  let items = (saved ?? []).map((s) => s.skill_resources).filter(Boolean) as unknown as (SkillResource & { skills: { name: string } })[];

  if (query?.trim()) {
    const q = query.trim().toLowerCase();
    items = items.filter((r) => r.title.toLowerCase().includes(q) || (r.provider ?? "").toLowerCase().includes(q));
  }

  if (items.length === 0) {
    return <EmptyState label={query ? `No saved resources match "${query}".` : "No saved resources yet."} />;
  }

  return (
    <div className="space-y-3">
      {items.map((r) => (
        <div key={r.id} className="rounded-card-sm border border-line-strong bg-surface p-4 shadow-card">
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="block">
            <p className="text-[14px] font-bold text-ink">{r.title}</p>
            <p className="mt-1 text-[11.5px] font-medium text-ink/50">
              {r.skills?.name} · {r.provider ?? "Unknown provider"}
            </p>
          </a>
          <div className="mt-2 flex justify-end">
            <SaveResourceButton resourceId={r.id} initialSaved={true} isAuthed={true} />
          </div>
        </div>
      ))}
    </div>
  );
}

async function SavedBusinesses({ userId, query }: { userId: string; query?: string }) {
  const supabase = await createClient();
  const { data: saved } = await supabase
    .from("saved_businesses")
    .select("business_id, saved_at, businesses(*)")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  let items = (saved ?? []).map((s) => s.businesses).filter(Boolean) as unknown as Business[];

  if (query?.trim()) {
    const q = query.trim().toLowerCase();
    items = items.filter((b) => b.name.toLowerCase().includes(q));
  }

  if (items.length === 0) {
    return <EmptyState label={query ? `No saved businesses match "${query}".` : "No saved businesses yet."} />;
  }

  return (
    <div className="space-y-3">
      {items.map((b) => (
        <BusinessCard key={b.id} business={b} isSaved={true} isAuthed={true} />
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-card border border-line-strong bg-surface p-8 text-center shadow-card">
      <p className="text-[13px] text-ink/55">{label}</p>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="py-4 text-center">
      <p className="font-display text-[19px] font-bold text-ink tabular">{value}</p>
      <p className="mt-0.5 text-[10.5px] font-semibold text-ink/50">{label}</p>
    </div>
  );
}

function ProfileLinkRow({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex w-full items-center justify-between rounded-card-sm border border-line-strong bg-surface px-4 py-4 shadow-card">
      <span className="text-[14px] font-semibold text-ink">{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="m9 6 6 6-6 6" stroke="rgb(var(--ink) / 0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink/35">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
