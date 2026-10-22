"use client";

import { useState, useTransition } from "react";
import { updateFeaturedOpportunityStatus } from "@/lib/actions/featured-opportunities";
import type { ApplicationStatus } from "@/lib/types";

// "Not Applied" is "saved" under the hood (the same default the row
// starts at / the state before any row exists) and "Hired" reuses the
// existing "accepted" value — see the enum note in the migration this
// table came from. Labeled separately from APPLICATION_STATUS_LABELS so a
// future change to that map (used by real opportunities) can't silently
// change this wording too.
const FEATURED_STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Not Applied",
  applied: "Applied",
  interviewing: "Interviewing",
  rejected: "Rejected",
  accepted: "Hired",
};

const FEATURED_STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: "bg-muted text-muted-foreground",
  applied: "bg-primary-soft text-primary-strong",
  interviewing: "bg-primary-soft text-primary-strong",
  rejected: "bg-destructive/10 text-destructive",
  accepted: "bg-primary-soft text-primary-strong",
};

export default function FeaturedStatusControl({
  featuredId,
  currentStatus,
}: {
  featuredId: string;
  currentStatus: ApplicationStatus;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.stopPropagation();
    e.preventDefault();
    const next = e.target.value as ApplicationStatus;
    setStatus(next);
    startTransition(() => updateFeaturedOpportunityStatus(featuredId, next));
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      onClick={(e) => e.stopPropagation()}
      disabled={isPending}
      aria-label="Application status"
      className={`h-7 shrink-0 rounded-md border-0 px-2 text-xs font-semibold disabled:opacity-50 ${FEATURED_STATUS_COLORS[status]}`}
    >
      {Object.entries(FEATURED_STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
