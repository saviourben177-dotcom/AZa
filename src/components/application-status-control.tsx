"use client";

import { useState, useTransition } from "react";
import { updateApplicationStatus } from "@/lib/actions/applications";
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from "@/lib/types";

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: "bg-paper-dim text-ink/55",
  applied: "bg-aza-light text-aza",
  interviewing: "bg-gold-light text-gold",
  rejected: "bg-danger-light text-danger",
  accepted: "bg-aza-light text-aza",
};

export default function ApplicationStatusControl({
  opportunityId,
  currentStatus,
}: {
  opportunityId: string;
  currentStatus: ApplicationStatus;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.stopPropagation();
    const next = e.target.value as ApplicationStatus;
    setStatus(next);
    startTransition(() => updateApplicationStatus(opportunityId, next));
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      onClick={(e) => e.stopPropagation()}
      disabled={isPending}
      className={`rounded-pill border-0 px-2.5 py-1 text-[11px] font-bold disabled:opacity-50 ${STATUS_COLORS[status]}`}
    >
      {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );
}
