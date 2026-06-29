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
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/growth" aria-label="Back" className="text-ink/60">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <h1 className="font-display text-[18px] font-extrabold text-ink">Ideas</h1>
        </div>
        <Link href="/growth/ideas/new" className="rounded-full bg-aza px-3 py-1.5 text-[12px] font-bold text-white">
          + New Idea
        </Link>
      </div>

      <div className="mt-4 flex gap-2">
        <TabLink label="For You" active={!filter} filter={null} />
        <TabLink label="Trending" active={filter === "trending"} filter="trending" />
        {user && <TabLink label="My Ideas" active={filter === "mine"} filter="mine" />}
      </div>

      <div className="mt-4 space-y-2.5">
        {(ideas ?? []).length === 0 && (
          <div className="rounded-card border border-dashed border-line bg-surface/60 p-8 text-center">
            <p className="text-[13px] text-ink/60">No ideas here yet — be the first to share one.</p>
          </div>
        )}
        {ideas?.map((idea) => (
          <Link key={idea.id} href={`/growth/ideas/${idea.id}`} className="block rounded-card border border-line bg-surface p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-ink">{idea.title}</p>
                {idea.category && <p className="mt-0.5 text-[11px] text-ink/45">{idea.category}</p>}
              </div>
              <UpvoteButton ideaId={idea.id} count={idea.upvotes_count} upvoted={upvotedIds.has(idea.id)} isAuthed={!!user} />
            </div>
            <p className="mt-1.5 line-clamp-2 text-[12.5px] text-ink/65">{idea.description}</p>
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
      className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold ${
        active ? "border-aza bg-aza text-white" : "border-line bg-surface text-ink/70"
      }`}
    >
      {label}
    </Link>
  );
}
