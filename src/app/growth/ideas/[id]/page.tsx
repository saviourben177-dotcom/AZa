import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import UpvoteButton from "@/components/growth/upvote-button";
import IdeaStageControl from "@/components/growth/idea-stage-control";
import DeleteIdeaButton from "@/components/growth/delete-idea-button";
import ShareButton from "@/components/share-button";

export const dynamic = "force-dynamic";

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: idea, error } = await supabase
    .from("ideas")
    .select("*, profiles(full_name), idea_roles(id)")
    .eq("id", id)
    .single();
  if (error || !idea) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let upvoted = false;
  if (user) {
    const { data } = await supabase
      .from("idea_upvotes")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("idea_id", id)
      .maybeSingle();
    upvoted = !!data;
  }

  const isOwner = user?.id === idea.user_id;
  const author = (idea.profiles as unknown as { full_name: string | null } | null)?.full_name;
  const openRoleCount = (idea.idea_roles as unknown[] | null)?.length ?? 0;

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between">
        <Link href="/growth/ideas" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-dim text-ink/70">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <div className="flex items-center gap-2">
          <ShareButton title={idea.title} />
          {/* Bookmark/save icon from the mockup is intentionally omitted —
              saved_ideas table doesn't exist yet (screen-mapping doc §15),
              so there's nowhere real to persist a save. */}
        </div>
      </div>

      <h1 className="mt-4 text-[21px] font-bold leading-tight text-ink">{idea.title}</h1>
      <p className="mt-1 text-[12.5px] font-medium text-text-secondary">
        {author ?? "Aza member"} · {new Date(idea.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {idea.category && (
          <span className="rounded-pill bg-aza-light px-3 py-1.5 text-[11px] font-semibold text-aza">
            {idea.category}
          </span>
        )}
        <UpvoteButton ideaId={idea.id} count={idea.upvotes_count} upvoted={upvoted} isAuthed={!!user} />
        {/* idea_comments doesn't exist — no comment count chip rendered. */}
      </div>

      <section className="mt-5 rounded-card bg-surface p-5 shadow-card">
        <h2 className="text-[15px] font-semibold text-ink">About this idea</h2>
        <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-ink/70">{idea.description}</p>
      </section>

      {idea.tags?.length > 0 && (
        <section className="mt-3 rounded-card bg-surface p-5 shadow-card">
          <h2 className="text-[15px] font-semibold text-ink">Looking for</h2>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {idea.tags.map((tag: string) => (
              <span key={tag} className="rounded-pill bg-paper-dim px-3 py-1.5 text-[12px] font-semibold text-text-secondary">{tag}</span>
            ))}
          </div>
        </section>
      )}

      <section className="mt-3 rounded-card bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] font-medium text-text-secondary">Stage</span>
          <IdeaStageControl ideaId={idea.id} currentStage={idea.stage} canEdit={isOwner} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[12.5px] font-medium text-text-secondary">Visibility</span>
          <span className="text-[12.5px] font-semibold capitalize text-ink">{idea.visibility}</span>
        </div>
      </section>

      {!isOwner && idea.looking_for_collaborators && (
        <Link
          href={`/businesses/team-finder/${idea.id}`}
          className="mt-5 block rounded-pill bg-aza py-3.5 text-center text-[14.5px] font-semibold text-white shadow-glow-accent"
        >
          {openRoleCount > 0 ? `Interested in joining (${openRoleCount} open role${openRoleCount === 1 ? "" : "s"})` : "See open roles"}
        </Link>
      )}

      {isOwner && (
        <div className="mt-6 flex items-center justify-between">
          <Link href={`/businesses/team-finder/${idea.id}`} className="text-[12.5px] font-semibold text-aza">
            Manage roles ({openRoleCount})
          </Link>
          <DeleteIdeaButton ideaId={idea.id} />
        </div>
      )}
    </div>
  );
}
