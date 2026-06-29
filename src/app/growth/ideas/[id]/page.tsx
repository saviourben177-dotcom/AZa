import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import UpvoteButton from "@/components/growth/upvote-button";
import IdeaStageControl from "@/components/growth/idea-stage-control";
import DeleteIdeaButton from "@/components/growth/delete-idea-button";

export const dynamic = "force-dynamic";

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: idea, error } = await supabase.from("ideas").select("*").eq("id", id).single();
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

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between">
        <Link href="/growth/ideas" className="text-ink/60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <UpvoteButton ideaId={idea.id} count={idea.upvotes_count} upvoted={upvoted} isAuthed={!!user} />
      </div>

      <h1 className="mt-4 font-display text-[20px] font-extrabold leading-tight text-ink">{idea.title}</h1>
      {idea.category && (
        <span className="mt-2 inline-block rounded-full bg-paper-dim px-2.5 py-1 text-[11px] font-semibold text-ink/60">
          {idea.category}
        </span>
      )}

      <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-ink/75">{idea.description}</p>

      {idea.tags?.length > 0 && (
        <div className="mt-4">
          <p className="text-[12px] font-semibold text-ink/50">Skills needed</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {idea.tags.map((tag: string) => (
              <span key={tag} className="rounded-full bg-paper-dim px-2.5 py-1 text-[11px] font-medium text-ink/60">{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <p className="text-[12px] font-semibold text-ink/50">Stage</p>
        <div className="mt-1.5">
          <IdeaStageControl ideaId={idea.id} currentStage={idea.stage} canEdit={isOwner} />
        </div>
      </div>

      <p className="mt-4 text-[11.5px] text-ink/40">
        Last updated {new Date(idea.updated_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
      </p>

      {isOwner && (
        <div className="mt-6">
          <DeleteIdeaButton ideaId={idea.id} />
        </div>
      )}
    </div>
  );
}
