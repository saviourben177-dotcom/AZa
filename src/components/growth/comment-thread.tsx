"use client";

import { useState } from "react";
import IdeaAuthorRow from "@/components/growth/idea-author-row";
import DeleteCommentButton from "@/components/growth/delete-comment-button";
import CommentReactionButtons from "@/components/growth/comment-reaction-buttons";
import ReplyForm from "@/components/growth/reply-form";
import type { CommentReaction, IdeaComment } from "@/lib/types";

interface CommenterInfo {
  full_name: string | null;
  avatar_url: string | null;
}

export default function CommentThread({
  ideaId,
  comment,
  replies,
  commenters,
  reactionsByCommentId,
  currentUserId,
  isAuthed,
}: {
  ideaId: string;
  comment: IdeaComment;
  replies: IdeaComment[];
  commenters: Map<string, CommenterInfo>;
  reactionsByCommentId: Map<string, CommentReaction>;
  currentUserId: string | undefined;
  isAuthed: boolean;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const commenter = commenters.get(comment.user_id);

  return (
    <div className="rounded-card-sm border border-line-strong bg-surface p-3.5 shadow-card">
      <div className="flex items-center justify-between">
        <IdeaAuthorRow
          name={commenter?.full_name ?? "Aza user"}
          avatarUrl={commenter?.avatar_url}
          createdAt={comment.created_at}
        />
        {currentUserId === comment.user_id && <DeleteCommentButton commentId={comment.id} ideaId={ideaId} />}
      </div>

      <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-ink/70">{comment.body}</p>

      <div className="mt-2 flex items-center gap-3">
        <CommentReactionButtons
          ideaId={ideaId}
          commentId={comment.id}
          likesCount={comment.likes_count}
          dislikesCount={comment.dislikes_count}
          myReaction={reactionsByCommentId.get(comment.id) ?? null}
          isAuthed={isAuthed}
        />
        <button
          onClick={() => setShowReplyForm((v) => !v)}
          className="text-[11px] font-bold text-ink/45"
        >
          Reply
        </button>
      </div>

      {showReplyForm && (
        <ReplyForm
          ideaId={ideaId}
          parentCommentId={comment.id}
          isAuthed={isAuthed}
          onDone={() => {
            setShowReplyForm(false);
            setShowReplies(true);
          }}
        />
      )}

      {replies.length > 0 && (
        <div className="mt-2.5 border-l-2 border-line-strong pl-3">
          {!showReplies ? (
            <button
              onClick={() => setShowReplies(true)}
              className="text-[11.5px] font-bold text-aza"
            >
              View {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </button>
          ) : (
            <div className="space-y-3">
              {replies.map((reply) => {
                const replyCommenter = commenters.get(reply.user_id);
                return (
                  <div key={reply.id}>
                    <div className="flex items-center justify-between">
                      <IdeaAuthorRow
                        name={replyCommenter?.full_name ?? "Aza user"}
                        avatarUrl={replyCommenter?.avatar_url}
                        createdAt={reply.created_at}
                      />
                      {currentUserId === reply.user_id && (
                        <DeleteCommentButton commentId={reply.id} ideaId={ideaId} />
                      )}
                    </div>
                    <p className="mt-1.5 whitespace-pre-line text-[12.5px] leading-relaxed text-ink/70">
                      {reply.body}
                    </p>
                    <div className="mt-1.5">
                      <CommentReactionButtons
                        ideaId={ideaId}
                        commentId={reply.id}
                        likesCount={reply.likes_count}
                        dislikesCount={reply.dislikes_count}
                        myReaction={reactionsByCommentId.get(reply.id) ?? null}
                        isAuthed={isAuthed}
                      />
                    </div>
                  </div>
                );
              })}
              <button
                onClick={() => setShowReplies(false)}
                className="text-[11px] font-bold text-ink/40"
              >
                Hide replies
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
