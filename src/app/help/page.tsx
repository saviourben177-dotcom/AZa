import type { Metadata } from "next";
import { BareShell } from "@/components/aza/kit";
import { infoPages } from "@/lib/aza/info";
import ReplayGuideRow from "@/components/app-guide/replay-guide-row";

export const metadata: Metadata = {
  title: "Help — Aza",
  description: "Answers to common questions about using Aza.",
};

export default function HelpPage() {
  return (
    <BareShell>
      <h1 className="mb-2 text-3xl font-display font-extrabold tracking-tight">Help</h1>
      <p className="mb-8 text-muted-foreground">Answers to common questions about using Aza.</p>
      <div className="mb-8">
        <ReplayGuideRow />
      </div>
      <div className="space-y-6">
        {infoPages.help.map(([h, b]) => (
          <section key={h}>
            <h2 className="mb-1 text-lg font-display font-bold">{h}</h2>
            <p className="leading-relaxed text-foreground/85">{b}</p>
          </section>
        ))}
      </div>
    </BareShell>
  );
}
