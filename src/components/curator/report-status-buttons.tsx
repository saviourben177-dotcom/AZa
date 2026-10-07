"use client";

import { useTransition } from "react";
import { updateReportStatus } from "@/lib/actions/reports";

export default function ReportStatusButtons({ reportId }: { reportId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      <button disabled={isPending} onClick={() => startTransition(() => updateReportStatus(reportId, "reviewed"))} className="rounded-pill border border-aza/30 px-3 py-1.5 text-[11px] font-bold text-aza disabled:opacity-50">
        Reviewed
      </button>
      <button disabled={isPending} onClick={() => startTransition(() => updateReportStatus(reportId, "dismissed"))} className="rounded-pill border border-line-strong px-3 py-1.5 text-[11px] font-bold text-ink/55 disabled:opacity-50">
        Dismiss
      </button>
    </div>
  );
}
