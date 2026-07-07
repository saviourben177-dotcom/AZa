"use client";

import { useState, useTransition, useRef } from "react";
import { markGuideSeen } from "@/lib/actions/app-guide";
import { GUIDE_STEPS } from "@/lib/app-guide-steps";

const ICONS: Record<string, React.ReactNode> = {
  welcome: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path d="M12 2 4 6v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-4Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  discover: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.6" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  cv: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12h6M9 15.5h6M9 8.5h3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  skills: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.5" stroke="white" strokeWidth="1.6" />
    </svg>
  ),
  ideas: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6h5.4c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  business: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  profile: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.2" stroke="white" strokeWidth="1.7" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
};

export default function AppGuideOverlay({ onDone }: { onDone?: () => void }) {
  const [index, setIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const touchStartX = useRef<number | null>(null);

  const isLast = index === GUIDE_STEPS.length - 1;
  const step = GUIDE_STEPS[index];

  function finish() {
    startTransition(() => markGuideSeen());
    onDone?.();
  }

  function goNext() {
    if (isLast) {
      finish();
    } else {
      setIndex((i) => Math.min(i + 1, GUIDE_STEPS.length - 1));
    }
  }

  function goBack() {
    setIndex((i) => Math.max(i - 1, 0));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -50) goNext();
    else if (delta > 50) goBack();
    touchStartX.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="App guide"
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-end px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] sm:justify-center sm:pb-0">
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative overflow-hidden rounded-card bg-surface shadow-elevated"
        >
          <button
            onClick={finish}
            disabled={isPending}
            className="absolute right-4 top-4 z-10 rounded-pill bg-ink/25 px-3 py-1.5 text-[11.5px] font-bold text-white backdrop-blur-sm"
          >
            Skip
          </button>

          <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-aza-dark via-aza to-emerald-400">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgb(255_255_255/0.2),transparent_45%)]" />
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 shadow-card backdrop-blur-sm">
              {ICONS[step.key]}
            </div>
          </div>

          <div className="px-6 pb-6 pt-5">
            <p className="text-[11.5px] font-bold uppercase tracking-wide text-aza">{step.eyebrow}</p>
            <h2 className="mt-1.5 font-display text-[19px] font-bold leading-tight text-ink">{step.title}</h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink/65">{step.body}</p>

            <div className="mt-6 flex items-center justify-center gap-1.5">
              {GUIDE_STEPS.map((s, i) => (
                <span
                  key={s.key}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-5 bg-aza" : "w-1.5 bg-line-strong"
                  }`}
                />
              ))}
            </div>

            <div className="mt-6 flex gap-2.5">
              {index > 0 && (
                <button
                  onClick={goBack}
                  className="rounded-card border border-line-strong bg-surface px-5 py-3 text-[13.5px] font-bold text-ink/60 shadow-card"
                >
                  Back
                </button>
              )}
              <button
                onClick={goNext}
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-card bg-aza py-3 text-[14px] font-bold text-white shadow-glow-accent disabled:opacity-60"
              >
                {isLast ? "Get Started" : "Next"}
                {!isLast && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
