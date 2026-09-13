"use client";

import { useState } from "react";

export default function ShareIdeaButton({
  ideaId,
  title,
}: {
  ideaId: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/growth/ideas/${ideaId}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled the share sheet — no-op
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently ignore, nothing to fall back to
    }
  }

  return (
    <button
      onClick={handleShare}
      aria-label="Share this idea"
      className="shrink-0 rounded-full p-1.5 text-ink/50"
    >
      {copied ? (
        <span className="text-[10.5px] font-bold text-aza">Copied</span>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
