import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import UpvoteButton from "@/components/growth/upvote-button";
import SaveIdeaButton from "@/components/save-idea-button";

export const dynamic = "force-dynamic";

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase.from("ideas").select("*").order("created_at", { ascending: false });
  if (filter === "mine" && user) query = query.eq("user_id", user.id);
  if (filter === "trending") query = query.order("upvotes_count", { ascending: false });

  const { data: ideas } = await query.limit(50);

  let upvotedIds = new Set<string>();
  let savedIds = new Set<string>();
  if (user) {
    const [{ data: upvotes }, { data: savedIdeas }] = await Promise.all([
      supabase.from("idea_upvotes").select("idea_id").eq("user_id", user.id),
      supabase.from("saved_ideas").select("idea_id").eq("user_id", user.id),
    ]);
    upvotedIds = new Set((upvotes ?? []).map((u) => u.idea_id));
    savedIds = new Set((savedIdeas ?? []).map((s) => s.idea_id));
  }

  return (
    <div className="px-5 pt-7">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/growth" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <h1 className="font-display text-[19px] font-bold text-ink">Ideas</h1>
        </div>
        <Link href="/growth/ideas/new" className="rounded-pill bg-aza px-4 py-2 text-[12.5px] font-bold text-white shadow-glow-accent">
          + New
        </Link>
      </div>

      <div className="mt-5 flex gap-2">
        <TabLink label="For You" active={!filter} filter={null} />
        <TabLink label="Trending" active={filter === "trending"} filter="trending" />
        {user && <TabLink label="My Ideas" active={filter === "mine"} filter="mine" />}
      </div>

      <div className="mt-4 space-y-3">
        {(ideas ?? []).length === 0 && (
          <div className="rounded-card border border-line-strong bg-surface px-8 py-10 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-aza-light to-aza-light/40 shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_2px_6px_-2px_rgb(var(--accent)/0.35)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_2px_6px_-2px_rgb(var(--accent)/0.45)]">
              <Lightbulb size={22} strokeWidth={1.8} className="text-aza" />
            </div>
            <p className="font-display text-[14.5px] font-bold text-ink">No ideas here yet</p>
            <p className="mx-auto mt-1.5 max-w-[220px] text-[12.5px] leading-relaxed text-ink/55">
              Be the first to share one — pitch a concept and get feedback from the community.
            </p>
            <Link
              href="/growth/ideas/new"
              className="mt-4 inline-block rounded-pill bg-aza px-4 py-2 text-[12.5px] font-bold text-white shadow-glow-accent"
            >
              + Share an idea
            </Link>
          </div>
        )}
        {ideas?.map((idea) => (
          <Link key={idea.id} href={`/growth/ideas/${idea.id}`} className="block rounded-card-sm border border-line-strong bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-ink">{idea.title}</p>
                {idea.category && <p className="mt-1 text-[11px] font-semibold text-ink/45">{idea.category}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <UpvoteButton ideaId={idea.id} count={idea.upvotes_count} upvoted={upvotedIds.has(idea.id)} isAuthed={!!user} />
                <SaveIdeaButton ideaId={idea.id} initialSaved={savedIds.has(idea.id)} isAuthed={!!user} />
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink/65">{idea.description}</p>
            {idea.comments_count > 0 && (
              <p className="mt-2 flex items-center gap-1 text-[11.5px] font-semibold text-ink/45">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16v12H8l-4 4V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
                {idea.comments_count} comment{idea.comments_count === 1 ? "" : "s"}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

function TabLink({ label, active, filter }: { label: string; active: boolean; filter: string | null }) {
  return (
    <Link
      href={filter ? `/growth/ideas?filter=${filter}` : "/growth/ideas"}
      className={`rounded-pill border px-4 py-2 text-[13px] font-bold ${
        active ? "border-aza bg-aza text-white shadow-glow-accent" : "border-line-strong bg-surface text-ink/60"
      }`}
    >
      {label}
    </Link>
  );
}
