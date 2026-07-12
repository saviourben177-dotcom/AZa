"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createIdeaComment } from "@/lib/actions/idea-comments";

export default function CommentForm({ ideaId, isAuthed }: { ideaId: string; isAuthed: boolean }) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  if (!isAuthed) {
    return (
      <button
        onClick={() => router.push(`/login?next=/growth/ideas/${ideaId}`)}
        className="w-full rounded-card-sm border border-line-strong bg-surface px-4 py-3 text-left text-[13.5px] text-ink/45"
      >
        Log in to leave a comment
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    setError(null);

    startTransition(async () => {
      try {
        await createIdeaComment(ideaId, trimmed);
        setValue("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't post comment");
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-start gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a comment..."
        maxLength={1000}
        rows={2}
        disabled={isPending}
        className="flex-1 resize-none rounded-card-sm border border-line-strong bg-surface p-3 text-[13.5px] text-ink placeholder:text-ink/35 focus:border-aza focus:outline-none disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={isPending || value.trim().length === 0}
        className="shrink-0 rounded-pill bg-aza px-4 py-3 text-[13px] font-bold text-white shadow-glow-accent disabled:opacity-40"
      >
        Post
      </button>
      {error && <p className="mt-1 text-[11.5px] font-medium text-danger">{error}</p>}
    </form>
  );
}
