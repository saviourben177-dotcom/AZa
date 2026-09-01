"use client";

import { useState, useTransition } from "react";
import { completeIntro, completeIntroAndSignUp, completeIntroAndLogIn } from "./actions";

interface Step {
  key: string;
  image: string; // filename stem in /public/welcome/, theme prefix added at render
}

const STEPS: Step[] = [
  { key: "discover", image: "discover" },
  { key: "fit", image: "fit" },
  { key: "future", image: "future" },
  { key: "final", image: "final" },
];

export default function WelcomeFlow() {
  const [index, setIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  const isLast = index === STEPS.length - 1;
  const step = STEPS[index];

  function skip() {
    startTransition(() => completeIntro());
  }

  function goNext() {
    if (isLast) return;
    setIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setIndex((i) => Math.max(i - 1, 0));
  }

  function getStarted() {
    startTransition(() => completeIntroAndSignUp());
  }

  function goToLogin() {
    startTransition(() => completeIntroAndLogIn());
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-y-auto bg-paper">
      {/* Fixed top bar: progress dots + Skip. Kept outside the scrollable
          artwork area so it's never at risk of scrolling out of view. */}
      <div className="flex shrink-0 items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)+16px)]">
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={`h-2 w-2 rounded-full transition-all ${
                i === index ? "bg-aza" : "bg-line-strong"
              }`}
            />
          ))}
        </div>
        {!isLast ? (
          <button
            onClick={skip}
            disabled={isPending}
            className="text-[13.5px] font-bold text-aza"
          >
            Skip
          </button>
        ) : (
          <span className="text-[13.5px] font-bold text-transparent">Skip</span>
        )}
      </div>

      {/* Artwork — the reference design itself (headline, body copy and
          illustration baked into one image for pixel-exact fidelity).
          Capped with dvh so it can never push controls off-screen; scales
          down and scrolls internally only in the rare case it's still
          taller than the available space. */}
      <div className="flex min-h-0 flex-1 items-start justify-center px-4 py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/welcome/light_${step.image}.webp`}
          alt=""
          className="max-h-[62dvh] w-auto max-w-full object-contain dark:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/welcome/dark_${step.image}.webp`}
          alt=""
          className="hidden max-h-[62dvh] w-auto max-w-full object-contain dark:block"
        />
      </div>

      {/* Fixed bottom controls — real buttons, positioned and styled to
          match the reference mockups exactly. */}
      <div className="shrink-0 px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-3">
        {!isLast ? (
          <div className="flex items-center justify-between">
            {index > 0 ? (
              <button
                onClick={goBack}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-line-strong bg-paper text-ink shadow-card"
                aria-label="Back"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            ) : (
              <span className="h-14 w-14" />
            )}
            <button
              onClick={goNext}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-aza text-white shadow-glow-accent"
              aria-label="Next"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={getStarted}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-1.5 rounded-pill bg-aza py-4 text-[15px] font-bold text-white shadow-glow-accent disabled:opacity-60"
            >
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <p className="mt-4 text-center text-[13.5px] text-ink/55">
              Already have an account?{" "}
              <button
                onClick={goToLogin}
                disabled={isPending}
                className="font-bold text-aza disabled:opacity-60"
              >
                Log in
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
