import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Target, Globe } from "lucide-react";
import { AppShell } from "@/components/aza/app-shell";
import { Tag } from "@/components/aza/ui";
import { ideas as mockIdeas } from "@/lib/aza-data";
import { createClient } from "@/lib/supabase/server";
import UpvoteButton from "@/components/growth/upvote-button";
import IdeaStageControl from "@/components/growth/idea-stage-control";
import DeleteIdeaButton from "@/components/growth/delete-idea-button";
import SaveIdeaButton from "@/components/save-idea-button";
import ShareIdeaButton from "@/components/growth/share-idea-button";
import CommentForm from "@/components/growth/comment-form";
import CommentThread from "@/components/growth/comment-thread";
import IdeaAuthorRow from "@/components/growth/idea-author-row";
import type { CommentReaction, IdeaComment } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: dbIdea } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // If not in database, check mock prototype ideas
  const mockIdea = !dbIdea ? mockIdeas.find((i) => i.id === id) : null;
  if (!dbIdea && !mockIdea) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If mock idea
  if (!dbIdea && mockIdea) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl">
          <Link
            href="/growth/ideas"
            className="-ml-2 mb-4 inline-flex h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Ideas
          </Link>

          <article className="border-b pb-4">
            <IdeaAuthorRow
              name={mockIdea.author}
              avatarUrl={null}
              createdAt={new Date(Date.now() - mockIdea.hoursAgo * 3600000).toISOString()}
              size="md"
            />
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Tag tone="primary" icon={<Target className="size-3.5" />}>
                {mockIdea.ask}
              </Tag>
              <Tag>{mockIdea.stage}</Tag>
            </div>
            <p className="mt-4 text-lg leading-relaxed text-foreground">{mockIdea.pitch}</p>
          </article>

          <h2 className="mt-6 text-base font-semibold text-foreground">
            {mockIdea.comments.length ? "Conversation" : "No replies yet"}
          </h2>
          <ul className="mt-4 space-y-6">
            {mockIdea.comments.map((c) => (
              <li key={c.id} className="rounded-lg border bg-card p-4">
                <IdeaAuthorRow
                  name={c.author}
                  avatarUrl={null}
                  createdAt={new Date(Date.now() - c.hoursAgo * 3600000).toISOString()}
                  size="sm"
                />
                <p className="mt-2 text-base leading-relaxed text-foreground">{c.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </AppShell>
    );
  }

  // Real DB idea
  const idea = dbIdea!;
  const { data: author } = await supabase
    .from("public_profiles")
    .select("full_name, avatar_url")
    .eq("id", idea.user_id)
    .maybeSingle();

  let upvoted = false;
  let isSaved = false;
  if (user) {
    const [{ data: upvoteRow }, { data: savedRow }] = await Promise.all([
      supabase
        .from("idea_upvotes")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("idea_id", id)
        .maybeSingle(),
      supabase
        .from("saved_ideas")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("idea_id", id)
        .maybeSingle(),
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
        .filter(
          (p): p is { id: string; full_name: string | null; avatar_url: string | null } =>
            p.id !== null,
        )
        .map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }]),
    );
  }

  let reactionsByCommentId = new Map<string, CommentReaction>();
  if (user && commentList.length > 0) {
    const { data: myReactions } = await supabase
      .from("idea_comment_reactions")
      .select("comment_id, reaction")
      .eq("user_id", user.id)
      .in(
        "comment_id",
        commentList.map((c) => c.id),
      );
    reactionsByCommentId = new Map(
      (myReactions ?? []).map((r) => [r.comment_id, r.reaction as CommentReaction]),
    );
  }

  const topLevelComments = commentList.filter((c) => !c.parent_comment_id);
  const repliesByParentId = new Map<string, IdeaComment[]>();
  for (const c of commentList) {
    if (c.parent_comment_id) {
      const arr = repliesByParentId.get(c.parent_comment_id) ?? [];
      arr.push(c);
      repliesByParentId.set(c.parent_comment_id, arr);
    }
  }

  const isOwner = user?.id === idea.user_id;
  const authorName = author?.full_name ?? "Aza user";

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link
          href="/growth/ideas"
          className="-ml-2 mb-4 inline-flex h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Ideas
        </Link>

        <article className="border-b pb-4">
          <div className="flex items-center justify-between">
            <IdeaAuthorRow
              name={authorName}
              avatarUrl={author?.avatar_url}
              createdAt={idea.created_at}
              size="md"
              profileHref={isOwner ? "/profile" : `/u/${idea.user_id}`}
            />
            {isOwner && <DeleteIdeaButton ideaId={idea.id} />}
          </div>

          <h1 className="mt-4 font-display text-xl font-bold leading-tight text-foreground">
            {idea.title}
          </h1>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {idea.category && (
              <Tag tone="primary" icon={<Target className="size-3.5" />}>
                {idea.category}
              </Tag>
            )}
            {idea.stage && <Tag>{idea.stage}</Tag>}
          </div>

          <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-foreground">
            {idea.description}
          </p>

          {idea.image_url && (
            <div className="mt-4 overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={idea.image_url} alt={idea.title} className="w-full object-cover" />
            </div>
          )}

          {idea.link_url && (
            <a
              href={idea.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-2 rounded-lg border bg-card p-3 text-sm font-semibold text-primary hover:border-border-strong"
            >
              <Globe className="size-4 shrink-0" />
              <span className="truncate">{idea.link_url}</span>
            </a>
          )}

          <div className="mt-4 flex items-center gap-2 border-t pt-3">
            <UpvoteButton
              ideaId={idea.id}
              count={idea.upvotes_count}
              upvoted={upvoted}
              isAuthed={!!user}
            />
            <SaveIdeaButton ideaId={idea.id} initialSaved={isSaved} isAuthed={!!user} />
            <ShareIdeaButton ideaId={idea.id} title={idea.title} />
          </div>

          {isOwner && (
            <div className="mt-4 rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                Update Stage
              </p>
              <IdeaStageControl ideaId={idea.id} currentStage={idea.stage} canEdit={isOwner} />
            </div>
          )}
        </article>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-foreground">
            {topLevelComments.length ? "Conversation" : "No replies yet"}
          </h2>
          {topLevelComments.length === 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first. Have you seen this problem up close, or tried something similar?
            </p>
          )}

          <div className="mt-4 space-y-4">
            {topLevelComments.map((comment) => (
              <CommentThread
                key={comment.id}
                ideaId={idea.id}
                comment={comment}
                replies={repliesByParentId.get(comment.id) ?? []}
                commenters={commenters}
                reactionsByCommentId={reactionsByCommentId}
                currentUserId={user?.id}
                isAuthed={!!user}
              />
            ))}
          </div>

          <div className="mt-6">
            <CommentForm ideaId={idea.id} isAuthed={!!user} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
