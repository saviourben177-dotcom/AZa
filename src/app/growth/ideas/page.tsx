import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import UpvoteButton from "@/components/growth/upvote-button";

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
  if (user) {
    const { data: upvotes } = await supabase.from("idea_upvotes").select("idea_id").eq("user_id", user.id);
    upvotedIds = new Set((upvotes ?? []).map((u) => u.idea_id));
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
          <div className="rounded-card border border-line-strong bg-surface p-8 text-center shadow-card">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-aza-light text-xl">💡</div>
            <p className="text-[13px] text-ink/55">No ideas here yet — be the first to share one.</p>
          </div>
        )}
        {ideas?.map((idea) => (
          <Link key={idea.id} href={`/growth/ideas/${idea.id}`} className="block rounded-card-sm border border-line-strong bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-ink">{idea.title}</p>
                {idea.category && <p className="mt-1 text-[11px] font-semibold text-ink/45">{idea.category}</p>}
              </div>
              <UpvoteButton ideaId={idea.id} count={idea.upvotes_count} upvoted={upvotedIds.has(idea.id)} isAuthed={!!user} />
            </div>
            <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink/65">{idea.description}</p>
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
