"use client";

import { useState } from "react";
import type { ReportContentType } from "@/lib/actions/reports";
import ReportSheet from "./report-sheet";

export default function ReportButton({ contentType, contentId }: { contentType: ReportContentType; contentId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Report post" title="Report" className="flex h-8 w-8 items-center justify-center rounded-full text-ink/45 hover:bg-danger/10 hover:text-danger">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 21V4m0 0c5-3 8 3 14 0v10c-6 3-9-3-14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && <ReportSheet contentType={contentType} contentId={contentId} onClose={() => setOpen(false)} />}
    </>
  );
}
