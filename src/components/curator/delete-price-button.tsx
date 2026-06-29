"use client";

import { useTransition } from "react";
import { deletePrice } from "@/lib/actions/prices";

export default function DeletePriceButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this price entry?")) return;
    startTransition(() => deletePrice(id));
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
