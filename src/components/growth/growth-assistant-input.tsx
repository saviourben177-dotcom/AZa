"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { askGrowthHub } from "@/lib/actions/growth-assistant";

export default function GrowthAssistantInput({ isAuthed }: { isAuthed: boolean }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = question.trim();
    if (trimmed.length === 0) return;

    if (!isAuthed) {
      router.push("/login?next=/growth");
      return;
    }

    setError(null);
    setAnswer(null);
    startTransition(async () => {
      try {
        const result = await askGrowthHub(trimmed);
        setAnswer(result.answer);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong — try again");
      }
    });
  }

  return (
    <div className="mt-4 rounded-card border border-line-strong bg-surface p-4 shadow-card">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask or search anything..."
          maxLength={300}
          disabled={isPending}
          className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink placeholder:text-ink/40 focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isPending || question.trim().length === 0}
          aria-label="Ask"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aza text-white disabled:opacity-40"
        >
          {isPending ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14m0 0-6-6m6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </form>

      {error && <p className="mt-3 text-[12.5px] font-medium text-danger">{error}</p>}

      {answer && (
        <div className="mt-3 rounded-card-sm bg-aza-light/50 p-3.5">
          <p className="text-[13px] leading-relaxed text-ink/80">{answer}</p>
        </div>
      )}
    </div>
  );
}
