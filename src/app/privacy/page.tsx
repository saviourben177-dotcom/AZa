import type { Metadata } from "next";
import { BareShell } from "@/components/aza/kit";
import { infoPages } from "@/lib/aza/info";

export const metadata: Metadata = {
  title: "Privacy — Aza",
  description: "How Aza collects, uses and protects your data.",
};

export default function PrivacyPage() {
  return (
    <BareShell>
      <h1 className="mb-2 text-3xl font-display font-extrabold tracking-tight">Privacy</h1>
      <p className="mb-8 text-muted-foreground">How Aza collects, uses and protects your data.</p>
      <div className="space-y-6">
        {infoPages.privacy.map(([h, b]) => (
          <section key={h}>
            <h2 className="mb-1 text-lg font-display font-bold">{h}</h2>
            <p className="leading-relaxed text-foreground/85">{b}</p>
          </section>
        ))}
      </div>
    </BareShell>
  );
}
