import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import OpportunityCard from "@/components/opportunity-card";
import BusinessCard from "@/components/business-card";
import SaveIdeaButton from "@/components/save-idea-button";
import SaveResourceButton from "@/components/save-resource-button";
import type { Opportunity, Idea, SkillResource, Business, ApplicationStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type SavedTab = "opportunities" | "ideas" | "resources" | "businesses";

const TABS: { key: SavedTab; label: string }[] = [
  { key: "opportunities", label: "Opportunities" },
  { key: "ideas", label: "Ideas" },
  { key: "resources", label: "Resources" },
  { key: "businesses", label: "Businesses" },
];

export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab: SavedTab = (TABS.some((t) => t.key === rawTab) ? rawTab : "opportunities") as SavedTab;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile/saved");

  return (
    <div className="px-5 pt-7">
      <div className="flex items-center gap-3">
        <Link href="/profile" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[19px] font-bold text-ink">Saved</h1>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/profile/saved?tab=${t.key}`}
            className={`shrink-0 rounded-pill border px-4 py-2 text-[13px] font-bold ${
              tab === t.key ? "border-aza bg-aza text-white shadow-glow-accent" : "border-line-strong bg-surface text-ink/60"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-5">
        {tab === "opportunities" && <SavedOpportunitiesTab userId={user.id} />}
        {tab === "ideas" && <SavedIdeasTab userId={user.id} />}
        {tab === "resources" && <SavedResourcesTab userId={user.id} />}
        {tab === "businesses" && <SavedBusinessesTab userId={user.id} />}
      </div>
    </div>
  );
}

async function SavedOpportunitiesTab({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: saved } = await supabase
    .from("saved_opportunities")
    .select("opportunity_id, saved_at, status, opportunities(*)")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  const rows = (saved ?? []).filter((s) => s.opportunities);

  if (rows.length === 0) return <EmptyState label="No saved opportunities yet." />;

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

async function SavedIdeasTab({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: saved } = await supabase
    .from("saved_ideas")
    .select("idea_id, saved_at, ideas(*)")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  const items = (saved ?? []).map((s) => s.ideas).filter(Boolean) as unknown as Idea[];

  if (items.length === 0) return <EmptyState label="No saved ideas yet." />;

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

async function SavedResourcesTab({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: saved } = await supabase
    .from("saved_resources")
    .select("resource_id, saved_at, skill_resources(*, skills(name))")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  const items = (saved ?? []).map((s) => s.skill_resources).filter(Boolean) as unknown as (SkillResource & { skills: { name: string } })[];

  if (items.length === 0) return <EmptyState label="No saved resources yet." />;

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

async function SavedBusinessesTab({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: saved } = await supabase
    .from("saved_businesses")
    .select("business_id, saved_at, businesses(*)")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  const items = (saved ?? []).map((s) => s.businesses).filter(Boolean) as unknown as Business[];

  if (items.length === 0) return <EmptyState label="No saved businesses yet." />;

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
