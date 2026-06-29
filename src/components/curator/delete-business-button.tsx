"use client";

import { useTransition } from "react";
import { deleteBusiness } from "@/lib/actions/businesses";

export default function DeleteBusinessButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this business?")) return;
    startTransition(() => deleteBusiness(id));
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-[12px] font-semibold text-ink/40 disabled:opacity-50"
    >
      {isPending ? "..." : "Delete"}
    </button>
  );
}
