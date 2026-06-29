"use client";

import { useTransition } from "react";
import { updateListingStatus, deleteListing } from "@/lib/actions/marketplace";

export default function ListingOwnerControls({ listingId, currentStatus }: { listingId: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-card border border-line bg-surface p-3.5">
      <p className="text-[12px] font-semibold text-ink/50">Manage your listing</p>
      <div className="mt-2 flex gap-2">
        {["active", "sold", "closed"].map((s) => (
          <button
            key={s}
            disabled={isPending}
            onClick={() => startTransition(() => updateListingStatus(listingId, s as "active" | "sold" | "closed"))}
            className={`flex-1 rounded-card py-2 text-[12px] font-bold capitalize ${
              currentStatus === s ? "bg-aza text-white" : "bg-paper-dim text-ink/55"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          if (confirm("Delete this listing permanently?")) startTransition(() => deleteListing(listingId));
        }}
        disabled={isPending}
        className="mt-3 text-[12.5px] font-semibold text-danger"
      >
        Delete listing
      </button>
    </div>
  );
}
