import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import UpvoteButton from "@/components/growth/upvote-button";
import IdeaStageControl from "@/components/growth/idea-stage-control";
import DeleteIdeaButton from "@/components/growth/delete-idea-button";
import SaveIdeaButton from "@/components/save-idea-button";
import ShareIdeaButton from "@/components/growth/share-idea-button";
import CommentForm from "@/components/growth/comment-form";
import DeleteCommentButton from "@/components/growth/delete-comment-button";
import IdeaAuthorRow from "@/components/growth/idea-author-row";
import type { IdeaComment } from "@/lib/types";

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

  const { data: author } = await supabase
    .from("public_profiles")
    .select("full_name, avatar_url")
    .eq("id", idea.user_id)
    .maybeSingle();

  let upvoted = false;
  let isSaved = false;
  if (user) {
    const [{ data: upvoteRow }, { data: savedRow }] = await Promise.all([
      supabase.from("idea_upvotes").select("user_id").eq("user_id", user.id).eq("idea_id", id).maybeSingle(),
      supabase.from("saved_ideas").select("user_id").eq("user_id", user.id).eq("idea_id", id).maybeSingle(),
    ]);
    upvoted = !!upvoteRow;
    isSaved = !!savedRow;
  }

  const { data: comments } = await supabase
    .from("idea_comments")
    .select("*")
    .eq("idea_id", id)
    .order("created_at", { ascending: true });

  const commentList = (comments ?? []) as IdeaComment[];
  const commenterIds = Array.from(new Set(commentList.map((c) => c.user_id)));

  let commenters = new Map<string, { full_name: string | null; avatar_url: string | null }>();
  if (commenterIds.length > 0) {
    const { data: commenterProfiles } = await supabase
      .from("public_profiles")
      .select("id, full_name, avatar_url")
      .in("id", commenterIds);
    commenters = new Map(
      (commenterProfiles ?? [])
        .filter((p): p is { id: string; full_name: string | null; avatar_url: string | null } => p.id !== null)
        .map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
    );
  }

  const isOwner = user?.id === idea.user_id;
  const authorName = author?.full_name ?? "Aza user";

  return (
    <div className="px-5 pt-7">
      <div className="flex items-center justify-between">
        <Link href="/growth/ideas" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
      </div>

      {/* Post — person leads, same identity treatment as the feed card */}
      <div className="mt-4">
        <IdeaAuthorRow name={authorName} avatarUrl={author?.avatar_url} createdAt={idea.created_at} size="md" />
      </div>

      <h1 className="mt-4 font-display text-[20px] font-bold leading-tight text-ink">{idea.title}</h1>

      <section className="mt-3">
        <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink/70">{idea.description}</p>
      </section>

      {/* Engagement — same row shape as the feed card, right under the post */}
      <div className="mt-4 flex items-center gap-1 border-y border-line-strong py-3">
        <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold text-ink/50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h16v12H8l-4 4V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          {idea.comments_count}
        </span>
        <UpvoteButton ideaId={idea.id} count={idea.upvotes_count} upvoted={upvoted} isAuthed={!!user} />
        <div className="ml-auto flex items-center gap-1">
          <SaveIdeaButton ideaId={idea.id} initialSaved={isSaved} isAuthed={!!user} />
          <ShareIdeaButton ideaId={idea.id} title={idea.title} />
        </div>
      </div>

      {/* Structured details — secondary now, collapsed into one quiet block */}
      <details className="mt-4 rounded-card-sm border border-line-strong bg-surface open:pb-4">
        <summary className="cursor-pointer list-none px-4 py-3 text-[12px] font-bold uppercase tracking-wide text-ink/45">
          Idea details
        </summary>
        <div className="px-4">
          {idea.category && (
            <span className="inline-block rounded-pill bg-aza-light px-3 py-1.5 text-[11px] font-bold text-aza">
              {idea.category}
            </span>
          )}

          {idea.tags?.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45">Skills needed</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {idea.tags.map((tag: string) => (
                  <span key={tag} className="rounded-lg bg-aza-light px-2.5 py-1 text-[11px] font-bold text-aza">{tag}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45">Stage</p>
            <div className="mt-2">
              <IdeaStageControl ideaId={idea.id} currentStage={idea.stage} canEdit={isOwner} />
            </div>
          </div>

          <p className="mt-3 text-[11px] font-medium text-ink/40">
            Last updated {new Date(idea.updated_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
          </p>
        </div>
      </details>

      {/* Comments — a direct continuation of the post, not a separate footer section */}
      <section className="mt-6">
        <div>
          <CommentForm ideaId={idea.id} isAuthed={!!user} />
        </div>

        <div className="mt-4 space-y-3">
          {commentList.length === 0 && (
            <p className="text-[12.5px] text-ink/45">No comments yet — be the first to weigh in.</p>
          )}
          {commentList.map((comment) => {
            const commenter = commenters.get(comment.user_id);
            return (
              <div key={comment.id} className="rounded-card-sm border border-line-strong bg-surface p-3.5 shadow-card">
                <div className="flex items-center justify-between">
                  <IdeaAuthorRow
                    name={commenter?.full_name ?? "Aza user"}
                    avatarUrl={commenter?.avatar_url}
                    createdAt={comment.created_at}
                  />
                  {user?.id === comment.user_id && (
                    <DeleteCommentButton commentId={comment.id} ideaId={idea.id} />
                  )}
                </div>
                <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-ink/70">{comment.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {isOwner && (
        <div className="mt-6">
          <DeleteIdeaButton ideaId={idea.id} />
        </div>
      )}
    </div>
  );
}
