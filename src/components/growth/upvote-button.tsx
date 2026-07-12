"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleUpvote } from "@/lib/actions/ideas";

export default function UpvoteButton({
  ideaId, count, upvoted, isAuthed,
}: {
  ideaId: string; count: number; upvoted: boolean; isAuthed: boolean;
}) {
  const [localUpvoted, setLocalUpvoted] = useState(upvoted);
  const [localCount, setLocalCount] = useState(count);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthed) {
      router.push("/login?next=/growth/ideas");
      return;
    }
    const next = !localUpvoted;
    setLocalUpvoted(next);
    setLocalCount((c) => c + (next ? 1 : -1));
    startTransition(() => toggleUpvote(ideaId, localUpvoted));
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
        localUpvoted ? "bg-aza-light text-aza" : "bg-paper-dim text-ink/50"
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill={localUpvoted ? "currentColor" : "none"}>
        <path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      {localCount}
    </button>
  );
}
