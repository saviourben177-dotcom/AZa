"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Briefcase, Code2, GraduationCap, Trophy, Users } from "lucide-react";
import { completeIntro, completeIntroAndSignUp } from "./actions";

const categories = [
  { label: "Jobs", icon: Briefcase, href: "/discover?category=job_gig" },
  { label: "Scholarships & Grants", icon: GraduationCap, href: "/discover?category=scholarship" },
  { label: "Hackathons & Competitions", icon: Trophy, href: "/discover?category=hackathon" },
  { label: "Fellowships", icon: Users, href: "/discover?category=fellowship" },
  { label: "Skills & Tools", icon: Code2, href: "/growth/skills" },
];

export default function WelcomeCard({ opportunityCount: _opportunityCount }: { opportunityCount: number }) {
  // opportunityCount is fetched by the real server page and kept as a prop
  // for a future "N opportunities waiting" variant, but the reference
  // design doesn't use it — intentionally unused here rather than
  // wired to copy that would be misleading either way.
  const [isPending, startTransition] = useTransition();

  function handleGetStarted() {
    startTransition(() => completeIntroAndSignUp());
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[calc(env(safe-area-inset-top)+32px)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-16 size-48 rounded-full bg-primary/15 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-40 size-48 rounded-full bg-primary/15 blur-2xl"
      />

      <div className="relative z-10 text-center">
        <span
          className="aza-splash-logo inline-block font-display text-2xl font-extrabold tracking-tight text-foreground"
          aria-label="Aza"
        >
          aza<span className="text-primary">.</span>
        </span>

        <h1 className="mx-auto mt-6 max-w-sm text-4xl font-display font-extrabold leading-tight text-foreground">
          Find your next big <span className="text-primary">opportunity</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-base text-muted-foreground">
          Discover opportunities + knowledge and tools to act.
        </p>
      </div>

      {/*
        Reference design places a full illustrated hero here (a figure on a
        mountain overlooking a city). No such asset exists in this repo —
        add one to /public and swap this block for an <img>/<Image> once
        you have it. Left as empty space rather than a placeholder box so
        nothing fake is implied.
      */}
      <div className="relative z-10 my-10 flex-1" />

      <div className="relative z-10 mb-8 grid grid-cols-5 gap-2">
        {categories.map(({ label, icon: Icon, href }) => (
          <Link key={label} href={href} className="flex flex-col items-center gap-2 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary-strong">
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <span className="text-[11px] font-medium leading-tight text-foreground">{label}</span>
          </Link>
        ))}
      </div>

      <div className="relative z-10">
        <button
          disabled={isPending}
          onClick={handleGetStarted}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-bold text-primary-foreground btn-raised hover:bg-primary-strong disabled:opacity-50"
        >
          {isPending ? "Loading..." : "Get Started"}
        </button>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => completeIntro())}
          className="mt-3 block w-full text-center text-sm font-medium text-muted-foreground"
        >
          Skip for now
        </button>
        <p className="mt-4 flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span className="h-px w-8 bg-border" />
          Quick. Easy. Free.
          <span className="h-px w-8 bg-border" />
        </p>
      </div>
    </div>
  );
}
