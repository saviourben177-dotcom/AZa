"use client";

import { useState, useTransition } from "react";
import { createReport, type ReportContentType } from "@/lib/actions/reports";

const REASONS = [
  "Spam or scam",
  "Harassment or bullying",
  "Hate speech or discrimination",
  "Inappropriate content",
  "Misinformation",
  "Other",
];

export default function ReportSheet({
  contentType,
  contentId,
  onClose,
}: {
  contentType: ReportContentType;
  contentId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!reason) return;
    setError(null);
    startTransition(async () => {
      try {
        await createReport({ contentType, contentId, reason, details });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't send report");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/60 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <button aria-label="Close report" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className="relative w-full rounded-t-card bg-surface px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-4 shadow-elevated sm:max-w-md sm:rounded-card">
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-ink/15 sm:hidden" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="report-title" className="font-display text-lg font-bold text-ink">Report content</h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink/55">Tell us what is wrong. A curator will review your report.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 hover:bg-paper">×</button>
        </div>

        <div className="mt-5 grid gap-2">
          {REASONS.map((item) => (
            <button key={item} type="button" onClick={() => setReason(item)} className={`flex items-center justify-between rounded-card-sm border px-3.5 py-3 text-left text-[13px] font-semibold transition-colors ${reason === item ? "border-aza bg-aza-light text-aza" : "border-line-strong text-ink/70 hover:bg-paper"}`}>
              {item}
              <span className={`h-4 w-4 rounded-full border-2 ${reason === item ? "border-aza bg-aza shadow-[inset_0_0_0_3px_white]" : "border-ink/25"}`} />
            </button>
          ))}
        </div>

        <textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={1000} rows={2} placeholder="Add details (optional)" className="mt-3 w-full resize-none rounded-card-sm border border-line-strong bg-paper p-3 text-[13px] text-ink placeholder:text-ink/35 focus:border-aza focus:outline-none" />
        {error && <p className="mt-2 text-[12px] font-medium text-danger">{error}</p>}
        <button type="button" disabled={!reason || isPending} onClick={submit} className="mt-4 w-full rounded-pill bg-danger px-4 py-3 text-[13px] font-bold text-white disabled:opacity-40">
          {isPending ? "Sending report..." : "Send report"}
        </button>
      </div>
    </div>
  );
}
