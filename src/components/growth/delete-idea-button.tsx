"use client";

import { useTransition } from "react";
import { deleteIdea } from "@/lib/actions/ideas";

export default function DeleteIdeaButton({ ideaId }: { ideaId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this idea? This can't be undone.")) return;
    startTransition(() => deleteIdea(ideaId));
  }

  return (
    <button onClick={handleDelete} disabled={isPending} className="text-[12.5px] font-semibold text-danger disabled:opacity-50">
      {isPending ? "Deleting..." : "Delete idea"}
    </button>
  );
}
