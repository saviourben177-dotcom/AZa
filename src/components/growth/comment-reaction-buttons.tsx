"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleCommentReaction } from "@/lib/actions/idea-comment-reactions";
import type { CommentReaction } from "@/lib/types";

export default function CommentReactionButtons({
  ideaId,
  commentId,
  likesCount,
  dislikesCount,
  myReaction,
  isAuthed,
}: {
  ideaId: string;
  commentId: string;
  likesCount: number;
  dislikesCount: number;
  myReaction: CommentReaction | null;
  isAuthed: boolean;
}) {
  const [localReaction, setLocalReaction] = useState<CommentReaction | null>(myReaction);
  const [localLikes, setLocalLikes] = useState(likesCount);
  const [localDislikes, setLocalDislikes] = useState(dislikesCount);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleReact(reaction: CommentReaction) {
    if (!isAuthed) {
      router.push(`/login?next=/growth/ideas/${ideaId}`);
      return;
    }
    const previous = localReaction;

    // Optimistic local update
    if (previous === reaction) {
      // Un-react
      setLocalReaction(null);
      if (reaction === "like") setLocalLikes((c) => c - 1);
      else setLocalDislikes((c) => c - 1);
    } else {
      setLocalReaction(reaction);
      if (reaction === "like") {
        setLocalLikes((c) => c + 1);
        if (previous === "dislike") setLocalDislikes((c) => c - 1);
      } else {
        setLocalDislikes((c) => c + 1);
        if (previous === "like") setLocalLikes((c) => c - 1);
      }
    }

    startTransition(() => toggleCommentReaction(ideaId, commentId, reaction, previous));
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleReact("like")}
        disabled={isPending}
        aria-label="Like"
        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
          localReaction === "like" ? "bg-aza-light text-aza" : "text-ink/45"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill={localReaction === "like" ? "currentColor" : "none"}>
          <path
            d="M7 22h11a2 2 0 0 0 2-1.5l1.7-7a2 2 0 0 0-2-2.5H14l.7-4.3a1.8 1.8 0 0 0-3.2-1.4L7 10.5V22Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M7 22H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        {localLikes}
      </button>
      <button
        onClick={() => handleReact("dislike")}
        disabled={isPending}
        aria-label="Dislike"
        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
          localReaction === "dislike" ? "bg-danger/10 text-danger" : "text-ink/45"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill={localReaction === "dislike" ? "currentColor" : "none"} className="scale-y-[-1]">
          <path
            d="M7 22h11a2 2 0 0 0 2-1.5l1.7-7a2 2 0 0 0-2-2.5H14l.7-4.3a1.8 1.8 0 0 0-3.2-1.4L7 10.5V22Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M7 22H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        {localDislikes}
      </button>
    </div>
  );
}
