"use client";

import { useTransition } from "react";
import { deleteIdeaComment } from "@/lib/actions/idea-comments";

export default function DeleteCommentButton({ commentId, ideaId }: { commentId: string; ideaId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this comment?")) return;
    startTransition(() => deleteIdeaComment(commentId, ideaId));
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-[11px] font-bold text-danger/70 disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
