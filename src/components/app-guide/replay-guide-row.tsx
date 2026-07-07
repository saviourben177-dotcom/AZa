"use client";

import { useState } from "react";
import AppGuideOverlay from "./app-guide-overlay";

export default function ReplayGuideRow() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-card-sm border border-line-strong bg-surface px-4 py-4 shadow-card"
      >
        <span className="text-[14px] font-semibold text-ink">App Guide</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="m9 6 6 6-6 6" stroke="rgb(var(--ink) / 0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <AppGuideOverlay onDone={() => setOpen(false)} />}
    </>
  );
}
