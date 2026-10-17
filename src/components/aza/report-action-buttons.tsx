"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateReportStatus } from "@/lib/actions/reports";
import { btn } from "./kit";

export function ReportActionButtons({ reportId }: { reportId: string }) {
  const [isPending, startTransition] = useTransition();

  function act(status: "reviewed" | "dismissed") {
    startTransition(async () => {
      try {
        await updateReportStatus(reportId, status);
        toast.success(status === "reviewed" ? "Content removed" : "Report dismissed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="flex gap-2">
      <button disabled={isPending} className={btn.danger} onClick={() => act("reviewed")}>
        Remove content
      </button>
      <button disabled={isPending} className={btn.secondary} onClick={() => act("dismissed")}>
        Dismiss
      </button>
    </div>
  );
}
