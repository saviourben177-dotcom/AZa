"use client";

import { useState } from "react";

/**
 * Uses the browser's native share sheet (navigator.share) where available,
 * falling back to copy-to-clipboard. No backend/table needed for this —
 * it's a pure client capability, so it's fully functional, not a stub.
 */
export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <button
      onClick={handleShare}
      aria-label="Share"
      className="relative flex h-9 w-9 items-center justify-center rounded-full bg-paper-dim text-ink/70"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8.3 10.7 15.7 6.3M8.3 13.3l7.4 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      {copied && (
        <span className="absolute -bottom-8 right-0 whitespace-nowrap rounded-pill bg-elevated px-2.5 py-1 text-[10.5px] font-semibold text-white shadow-elevated">
          Link copied
        </span>
      )}
    </button>
  );
}
