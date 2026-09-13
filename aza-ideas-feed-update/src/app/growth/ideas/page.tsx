import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import UpvoteButton from "@/components/growth/upvote-button";
import SaveIdeaButton from "@/components/save-idea-button";
import ShareIdeaButton from "@/components/growth/share-idea-button";
import IdeaAuthorRow from "@/components/growth/idea-author-row";

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
  const ideaList = ideas ?? [];

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

  // Author identity — this is the piece that turns the list into a feed.
  const authorIds = Array.from(new Set(ideaList.map((idea) => idea.user_id)));
  let authors = new Map<string, { full_name: string | null; avatar_url: string | null }>();
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("public_profiles")
      .select("id, full_name, avatar_url")
      .in("id", authorIds);
    authors = new Map(
      (profiles ?? [])
        .filter((p): p is { id: string; full_name: string | null; avatar_url: string | null } => p.id !== null)
        .map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
    );
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
        {ideaList.length === 0 && (
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

        {ideaList.map((idea) => {
          const author = authors.get(idea.user_id);
          const authorName = author?.full_name ?? "Aza user";
          const visibleTags = (idea.tags ?? []).slice(0, 3);

          return (
            <Link
              key={idea.id}
              href={`/growth/ideas/${idea.id}`}
              className="block rounded-card-sm border border-line-strong bg-surface p-4 shadow-card"
            >
              {/* 1. Person — identity first, this is what makes it a feed not a listing */}
              <IdeaAuthorRow name={authorName} avatarUrl={author?.avatar_url} createdAt={idea.created_at} />

              {/* 2. Post — title leads, category/tags are quiet secondary context */}
              <div className="mt-3">
                <p className="text-[14.5px] font-bold leading-snug text-ink">{idea.title}</p>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink/65">{idea.description}</p>

                {(idea.category || visibleTags.length > 0) && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {idea.category && (
                      <span className="rounded-full bg-aza-light px-2.5 py-1 text-[10.5px] font-bold text-aza">
                        {idea.category}
                      </span>
                    )}
                    {visibleTags.map((tag: string) => (
                      <span key={tag} className="rounded-full bg-paper-dim px-2.5 py-1 text-[10.5px] font-semibold text-ink/50">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Engagement — comment / like / save / share, one row, equal weight */}
              <div className="mt-3.5 flex items-center gap-1 border-t border-line-strong pt-3">
                <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold text-ink/50">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4h16v12H8l-4 4V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                  {idea.comments_count}
                </span>
                <UpvoteButton ideaId={idea.id} count={idea.upvotes_count} upvoted={upvotedIds.has(idea.id)} isAuthed={!!user} />
                <div className="ml-auto flex items-center gap-1">
                  <SaveIdeaButton ideaId={idea.id} initialSaved={savedIds.has(idea.id)} isAuthed={!!user} />
                  <ShareIdeaButton ideaId={idea.id} title={idea.title} />
                </div>
              </div>
            </Link>
          );
        })}
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
