"use client";

import { useState } from "react";

export default function DetailAccordion({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-line last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-3.5 text-left"
      >
        <span className="text-[13.5px] font-semibold text-ink">{label}</span>
        <span className="flex items-center gap-2">
          {value !== undefined && (
            <span className="text-[12.5px] font-medium text-text-tertiary">{value}</span>
          )}
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            className={`text-text-tertiary transition-transform ${open ? "rotate-90" : ""}`}
          >
            <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && <div className="pb-4 text-[13px] leading-relaxed text-ink/65">{children}</div>}
    </div>
  );
}
