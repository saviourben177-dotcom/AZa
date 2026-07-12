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

  // Added a profiles join (existing table/column, not a schema change) so
  // cards can show a real author name instead of omitting it, matching the
  // mockup's "Daniel O." byline.
  let query = supabase
    .from("ideas")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });
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
        <h1 className="text-[22px] font-bold leading-tight text-ink">Ideas</h1>
        <Link href="/growth/ideas/new" className="rounded-pill bg-aza px-4 py-2 text-[12.5px] font-semibold text-white shadow-glow-accent">
          + New Idea
        </Link>
      </div>

      <div className="mt-4 flex rounded-pill bg-paper-dim p-1">
        <TabLink label="For You" active={!filter} filter={null} />
        <TabLink label="Trending" active={filter === "trending"} filter="trending" />
        {user && <TabLink label="My Ideas" active={filter === "mine"} filter="mine" />}
      </div>

      <div className="mt-4 space-y-3">
        {(ideas ?? []).length === 0 && (
          <div className="rounded-card bg-surface p-8 text-center shadow-card">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-aza-light text-xl">💡</div>
            <p className="text-[13px] text-text-secondary">No ideas here yet — be the first to share one.</p>
          </div>
        )}
        {ideas?.map((idea) => {
          const author = (idea.profiles as unknown as { full_name: string | null } | null)?.full_name;
          return (
            <Link key={idea.id} href={`/growth/ideas/${idea.id}`} className="block rounded-card bg-surface p-4 shadow-card">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card-sm bg-aza-light text-lg">
                  💡
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-semibold text-ink">{idea.title}</p>
                  <p className="mt-0.5 text-[11.5px] font-medium text-text-tertiary">
                    {author ?? "Aza member"}
                    {idea.category ? ` · ${idea.category}` : ""}
                  </p>
                </div>
              </div>
              <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-ink/65">{idea.description}</p>
              <div className="mt-3 flex items-center gap-3">
                <UpvoteButton ideaId={idea.id} count={idea.upvotes_count} upvoted={upvotedIds.has(idea.id)} isAuthed={!!user} />
                {/* idea_comments table doesn't exist — no comment-count chip
                    is rendered rather than showing a fabricated "0" or icon
                    that implies a feature which isn't there yet. */}
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
      className={`flex-1 rounded-pill py-2 text-center text-[13px] font-semibold ${
        active ? "bg-aza text-white" : "text-text-secondary"
      }`}
    >
      {label}
    </Link>
  );
}
