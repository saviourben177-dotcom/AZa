"use client";

import { useState, useTransition, useRef } from "react";
import { BadgeCheck, Bookmark, Check, Clock, ThumbsUp } from "lucide-react";
import { markGuideSeen } from "@/lib/actions/app-guide";
import { GUIDE_STEPS } from "@/lib/app-guide-steps";

// Small previews of the real screen each step describes, built from the
// app's actual card patterns and tokens (OpportunityCard, IdeaCard, the
// skills progress bar) — not live data, since this overlay can't capture
// the running app, but every label matches a real feature name.
const PREVIEWS: Record<string, React.ReactNode> = {
  welcome: (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-6 text-center">
      <span className="font-display text-2xl font-extrabold tracking-tight text-white">
        aza<span className="text-white/70">.</span>
      </span>
      <p className="text-[12px] text-white/70">Opportunities, skills, ideas and business tools</p>
    </div>
  ),
  discover: (
    <div className="flex h-full w-full items-center justify-center px-8">
      <div className="w-full max-w-[220px] rounded-lg border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-white/20 text-[11px] font-bold text-white">
            TF
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold text-white/80">Fellowship</p>
            <p className="truncate text-[12.5px] font-semibold text-white">Teach For Nigeria</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1 text-[10.5px] font-semibold text-white/80">
          <Clock className="size-3" /> Closes today
        </div>
      </div>
    </div>
  ),
  cv: (
    <div className="flex h-full w-full items-center justify-center px-8">
      <div className="w-full max-w-[220px] rounded-lg border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
        <p className="text-[11px] font-bold text-white">Summary</p>
        <div className="mt-1.5 space-y-1">
          <div className="h-1.5 w-full rounded-full bg-white/25" />
          <div className="h-1.5 w-4/5 rounded-full bg-white/25" />
        </div>
        <p className="mt-2.5 text-[11px] font-bold text-white">Skills</p>
        <div className="mt-1.5 flex gap-1">
          <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] text-white/80">
            Product design
          </span>
        </div>
      </div>
    </div>
  ),
  skills: (
    <div className="flex h-full w-full items-center justify-center px-8">
      <div className="w-full max-w-[220px] rounded-lg border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold text-white">HTML &amp; CSS</p>
          <span className="rounded-full border border-white/25 px-1.5 py-0.5 text-[9.5px] text-white/70">Coding</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-white/20">
          <div className="h-full w-[30%] rounded-full bg-white" />
        </div>
        <p className="mt-1.5 text-[10.5px] text-white/70">30% · Beginner</p>
      </div>
    </div>
  ),
  ideas: (
    <div className="flex h-full w-full items-center justify-center px-8">
      <div className="w-full max-w-[220px] rounded-lg border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
        <p className="w-fit rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
          Feedback wanted
        </p>
        <p className="mt-2 line-clamp-2 text-[11.5px] leading-snug text-white/90">
          A WhatsApp study buddy for JAMB candidates...
        </p>
        <div className="mt-2 flex items-center gap-3 text-white/70">
          <ThumbsUp className="size-3.5" />
          <Bookmark className="size-3.5" />
        </div>
      </div>
    </div>
  ),
  business: (
    <div className="grid h-full w-full grid-cols-2 gap-2 px-8">
      {["Directory", "Marketplace", "Funding", "Incubators"].map((label) => (
        <div
          key={label}
          className="flex items-center justify-center rounded-lg border border-white/15 bg-white/10 px-2 py-3 text-center text-[11px] font-semibold text-white/90 backdrop-blur-sm"
        >
          {label}
        </div>
      ))}
    </div>
  ),
  profile: (
    <div className="flex h-full w-full items-center justify-center px-8">
      <div className="w-full max-w-[220px] rounded-lg border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20 text-[12px] font-bold text-white">
            <BadgeCheck className="size-4" />
          </span>
          <div className="flex-1">
            <div className="h-1.5 w-20 rounded-full bg-white/25" />
          </div>
          <Check className="size-4 text-white/80" />
        </div>
      </div>
    </div>
  ),
};

const SWIPE_THRESHOLD = 50;

export default function AppGuideOverlay({ onDone }: { onDone?: () => void }) {
  const [index, setIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const touchStartX = useRef<number | null>(null);

  const step = GUIDE_STEPS[index];
  const isFirst = index === 0;
  const isLast = index === GUIDE_STEPS.length - 1;

  const finish = () => {
    startTransition(async () => {
      await markGuideSeen();
      onDone?.();
    });
  };

  const next = () => {
    if (isLast) {
      finish();
    } else {
      setIndex((i) => Math.min(i + 1, GUIDE_STEPS.length - 1));
    }
  };

  const back = () => setIndex((i) => Math.max(i - 1, 0));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX <= -SWIPE_THRESHOLD) next();
    else if (deltaX >= SWIPE_THRESHOLD) back();
    touchStartX.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm">
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative overflow-hidden rounded-card bg-surface shadow-[var(--shadow-lift)]"
        >
          <button
            onClick={finish}
            disabled={isPending}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/15 px-3 py-1.5 text-[12.5px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/25 disabled:opacity-60"
          >
            Skip
          </button>

          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-aza-dark via-aza to-emerald-400">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgb(255_255_255/0.2),transparent_45%)]" />
            {PREVIEWS[step.key]}
          </div>

          <div className="px-6 pb-6 pt-5">
            <div className="flex items-center justify-between">
              <p className="text-[11.5px] font-bold uppercase tracking-wide text-aza">{step.eyebrow}</p>
              <p className="text-[11px] font-semibold text-ink/40">
                Step {index + 1} of {GUIDE_STEPS.length}
              </p>
            </div>
            <h2 className="mt-1.5 font-display text-[19px] font-bold leading-tight text-ink">{step.title}</h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink/65">{step.body}</p>

            <div className="mt-5 flex items-center justify-center gap-1.5">
              {GUIDE_STEPS.map((s, i) => (
                <span
                  key={s.key}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-aza" : "w-1.5 bg-ink/15"
                  }`}
                />
              ))}
            </div>

            <div className="mt-5 flex gap-2.5">
              {!isFirst && (
                <button
                  onClick={back}
                  disabled={isPending}
                  className="flex-1 rounded-card border border-ink/15 py-3 text-[14px] font-bold text-ink disabled:opacity-60"
                >
                  Back
                </button>
              )}
              <button
                onClick={next}
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-card bg-aza py-3 text-[14px] font-bold text-white shadow-glow-accent disabled:opacity-60"
              >
                {isLast ? "Done" : "Next"}
                {!isLast && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
