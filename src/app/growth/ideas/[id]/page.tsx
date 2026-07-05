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
    <div className="px-5 pt-7">
      <div className="flex items-center justify-between">
        <Link href="/growth/ideas" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <UpvoteButton ideaId={idea.id} count={idea.upvotes_count} upvoted={upvoted} isAuthed={!!user} />
      </div>

      <h1 className="mt-4 font-display text-[21px] font-bold leading-tight text-ink">{idea.title}</h1>
      {idea.category && (
        <span className="mt-2 inline-block rounded-pill bg-aza-light px-3 py-1.5 text-[11px] font-bold text-aza">
          {idea.category}
        </span>
      )}

      <section className="mt-5 rounded-card border border-line-strong bg-surface p-5 shadow-card">
        <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink/70">{idea.description}</p>
      </section>

      {idea.tags?.length > 0 && (
        <div className="mt-4">
          <p className="text-[12px] font-bold uppercase tracking-wide text-ink/45">Skills needed</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {idea.tags.map((tag: string) => (
              <span key={tag} className="rounded-lg bg-aza-light px-2.5 py-1 text-[11px] font-bold text-aza">{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <p className="text-[12px] font-bold uppercase tracking-wide text-ink/45">Stage</p>
        <div className="mt-2">
          <IdeaStageControl ideaId={idea.id} currentStage={idea.stage} canEdit={isOwner} />
        </div>
      </div>

      <p className="mt-5 text-[11.5px] font-medium text-ink/40">
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
