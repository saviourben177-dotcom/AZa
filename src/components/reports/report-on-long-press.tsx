"use client";

import { useState, type ReactNode } from "react";
import type { ReportContentType } from "@/lib/actions/reports";
import { useLongPress } from "@/hooks/use-long-press";
import ReportSheet from "./report-sheet";

export default function ReportOnLongPress({ contentType, contentId, children }: { contentType: ReportContentType; contentId: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { pressing, handlers } = useLongPress(() => setOpen(true), 2000);

  return (
    <>
      <div {...handlers} className={`touch-manipulation transition-opacity ${pressing ? "opacity-60" : ""}`} aria-label="Hold for two seconds to report">
        {children}
      </div>
      {open && <ReportSheet contentType={contentType} contentId={contentId} onClose={() => setOpen(false)} />}
    </>
  );
}
