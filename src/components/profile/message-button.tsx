"use client";

import { useState, useTransition } from "react";
import { startOrOpenConversation } from "@/lib/actions/messages";

export default function MessageButton({ targetUserId }: { targetUserId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function open() {
    setError(null);
    startTransition(async () => {
      try {
        await startOrOpenConversation(targetUserId);
      } catch (err) {
        // redirect() throws a special error that Next handles itself; rethrow it.
        if (err && typeof err === "object" && "digest" in err && String((err as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        setError("Couldn't open the conversation. Please try again.");
      }
    });
  }

  return (
    <div className="flex-1">
      <button
        type="button"
        onClick={open}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-card border border-line-strong bg-surface px-4 py-3 text-[13.5px] font-bold text-ink shadow-card disabled:opacity-60"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-5 4V5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
        {isPending ? "Opening…" : "Message"}
      </button>
      {error && <p className="mt-2 text-center text-[12px] font-medium text-danger">{error}</p>}
    </div>
  );
}
