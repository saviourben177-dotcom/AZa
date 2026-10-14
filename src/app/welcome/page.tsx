import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { BareShell, btn } from "@/components/aza/kit";

export const metadata: Metadata = {
  title: "Welcome — Aza",
  description: "You're all set on Aza.",
};

export default function WelcomePage() {
  return (
    <BareShell narrow>
      <div className="pt-10 text-center">
        <span className="emboss-primary mx-auto grid size-16 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary">
          <Sparkles className="size-7" />
        </span>
        <h1 className="mt-6 text-3xl font-display font-bold text-foreground">You&apos;re in</h1>
        <p className="mt-2 text-muted-foreground">
          We found 3 opportunities that match your profile.
        </p>
        <Link href="/" className={`${btn.primary} mt-8 inline-flex`}>
          See my matches
        </Link>
      </div>
    </BareShell>
  );
}
