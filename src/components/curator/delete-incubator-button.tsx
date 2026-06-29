"use client";

import { useTransition } from "react";
import { deleteIncubator } from "@/lib/actions/incubators";

export default function DeleteIncubatorButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => { if (confirm("Delete this incubator?")) startTransition(() => deleteIncubator(id)); }}
      disabled={isPending}
      className="text-[12px] font-semibold text-ink/40 disabled:opacity-50"
    >
      {isPending ? "..." : "Delete"}
    </button>
  );
}
