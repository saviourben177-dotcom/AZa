"use client";

import { useTransition } from "react";
import { deleteBusinessTool } from "@/lib/actions/business-tools";

export default function DeleteToolButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => { if (confirm("Delete this tool?")) startTransition(() => deleteBusinessTool(id)); }}
      disabled={isPending}
      className="text-[12px] font-semibold text-ink/40 disabled:opacity-50"
    >
      {isPending ? "..." : "Delete"}
    </button>
  );
}
