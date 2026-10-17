"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { BareShell, btn } from "@/components/aza/kit";
import { completeIntro, completeIntroAndSignUp } from "./actions";

export default function WelcomeCard({ opportunityCount }: { opportunityCount: number }) {
  const [isPending, startTransition] = useTransition();

  function seeMatches() {
    startTransition(() => completeIntroAndSignUp());
  }

  function skip() {
    startTransition(() => completeIntro());
  }

  return (
    <BareShell narrow>
      <div className="pt-10 text-center">
        <span className="emboss-primary mx-auto grid size-16 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary">
          <Sparkles className="size-7" />
        </span>
        <h1 className="mt-6 text-3xl font-display font-bold text-foreground">You&apos;re in</h1>
        <p className="mt-2 text-muted-foreground">
          {opportunityCount > 0
            ? `We found ${opportunityCount} opportunit${opportunityCount === 1 ? "y" : "ies"} that match your profile.`
            : "Grants, scholarships, and teams are waiting for you."}
        </p>
        <button disabled={isPending} onClick={seeMatches} className={`${btn.primary} mt-8 inline-flex`}>
          {isPending ? "Loading..." : "See my matches"}
        </button>
        <button disabled={isPending} onClick={skip} className="mt-4 block w-full text-sm text-muted-foreground">
          Skip for now
        </button>
      </div>
    </BareShell>
  );
}
