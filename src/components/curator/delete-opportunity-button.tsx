"use client";

import { useTransition } from "react";
import { deleteOpportunity } from "@/lib/actions/opportunities";

export default function DeleteOpportunityButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this opportunity? This can't be undone.")) return;
    startTransition(() => deleteOpportunity(id));
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-[12.5px] font-semibold text-ink/40 disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
