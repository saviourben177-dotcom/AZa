"use client";

import { useState, useTransition } from "react";
import { completeIntro, completeIntroAndSignUp, completeIntroAndLogIn } from "./actions";
import {
  DiscoverIllustration,
  FitYouIllustration,
  BuildFutureIllustration,
  StartHereIllustration,
} from "./illustrations";

interface Step {
  key: string;
  eyebrow?: string;
  titleLine1: string;
  titleLine2: string;
  body: string;
  illustration: React.ReactNode;
}

const STEPS: Step[] = [
  {
    key: "discover",
    titleLine1: "Discover",
    titleLine2: "Opportunities",
    body: "Aza brings scholarships, jobs, internships, hackathons, grants and more — all in one place.",
    illustration: <DiscoverIllustration />,
  },
  {
    key: "fit",
    titleLine1: "Find What",
    titleLine2: "Fits You",
    body: "Explore and discover opportunities that match your interests, location and goals.",
    illustration: <FitYouIllustration />,
  },
  {
    key: "future",
    titleLine1: "Build Your",
    titleLine2: "Future",
    body: "Aza gives you the tools, connections and resources to learn, build and grow — all in one ecosystem.",
    illustration: <BuildFutureIllustration />,
  },
  {
    key: "start",
    titleLine1: "Your next opportunity",
    titleLine2: "starts here.",
    body: "Join thousands of people discovering opportunities and building amazing futures with Aza.",
    illustration: <StartHereIllustration />,
  },
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
    <div className="flex min-h-screen flex-col bg-paper px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+16px)]">
      <div className="flex shrink-0 items-center gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s.key}
            className={`h-1 flex-1 rounded-full transition-all ${
              i <= index ? "bg-aza" : "bg-line-strong"
            }`}
          />
        ))}
        {!isLast ? (
          <button
            onClick={skip}
            disabled={isPending}
            className="ml-2 shrink-0 text-[12.5px] font-bold text-aza"
          >
            Skip
          </button>
        ) : (
          <span className="ml-2 shrink-0 text-[12.5px] font-bold text-transparent">Skip</span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center overflow-y-auto py-4">
        <div className="flex items-center justify-center">{step.illustration}</div>

        <div className="mt-6 text-center">
          <h2 className="font-display text-[24px] font-bold leading-[1.15] text-ink">
            {step.titleLine1}
            <br />
            <span className="text-aza">{step.titleLine2}</span>
          </h2>
          <p className="mx-auto mt-2.5 max-w-[280px] text-[13.5px] leading-relaxed text-ink/55">
            {step.body}
          </p>
        </div>
      </div>

      {!isLast ? (
        <div className="mt-4 flex shrink-0 items-center justify-between">
          {index > 0 ? (
            <button
              onClick={goBack}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-paper-dim text-ink/70 shadow-card"
              aria-label="Back"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          ) : (
            <span className="h-11 w-11" />
          )}
          <button
            onClick={goNext}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-paper-dim text-aza shadow-card"
            aria-label="Next"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      ) : (
        <div className="mt-4 shrink-0 space-y-2.5">
          <button
            onClick={getStarted}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-1.5 rounded-pill bg-aza py-3.5 text-[14.5px] font-bold text-white shadow-glow-accent disabled:opacity-60"
          >
            Get Started
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button
            onClick={goToLogin}
            disabled={isPending}
            className="w-full rounded-pill border border-line-strong bg-surface py-3.5 text-[14px] font-bold text-ink/70 disabled:opacity-60"
          >
            I already have an account
          </button>
        </div>
      )}
    </div>
  );
}
