"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createIdeaComment } from "@/lib/actions/idea-comments";

export default function ReplyForm({
  ideaId,
  parentCommentId,
  isAuthed,
  onDone,
}: {
  ideaId: string;
  parentCommentId: string;
  isAuthed: boolean;
  onDone: () => void;
}) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthed) {
      router.push(`/login?next=/growth/ideas/${ideaId}`);
      return;
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    setError(null);

    startTransition(async () => {
      try {
        await createIdeaComment(ideaId, trimmed, parentCommentId);
        setValue("");
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't post reply");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-start gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Reply..."
        maxLength={1000}
        rows={1}
        autoFocus
        disabled={isPending}
        className="flex-1 resize-none rounded-card-sm border border-line-strong bg-surface p-2.5 text-[12.5px] text-ink placeholder:text-ink/35 focus:border-aza focus:outline-none disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={isPending || value.trim().length === 0}
        className="shrink-0 rounded-pill bg-aza px-3.5 py-2.5 text-[12px] font-bold text-white shadow-glow-accent disabled:opacity-40"
      >
        Reply
      </button>
      {error && <p className="mt-1 text-[11px] font-medium text-danger">{error}</p>}
    </form>
  );
}
