import type { Metadata } from "next";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";
import { funding as mockFunding } from "@/lib/aza-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Funding — Aza",
  description: "Loans, grants and equity funding for young African businesses.",
};

export default async function FundingPage() {
  const supabase = await createClient();
  const { data: grantsRaw } = await supabase
    .from("opportunities")
    .select("*")
    .eq("category", "grant")
    .order("deadline", { ascending: true, nullsFirst: false })
    .limit(20);

  const list =
    grantsRaw && grantsRaw.length > 0
      ? grantsRaw.map((g) => ({
          id: g.id,
          name: g.title,
          kind: (g.category === "grant" ? "Grant" : "Loan") as "Grant" | "Loan" | "Equity",
          amount: g.salary_range ?? "₦500k – ₦5M",
          note: g.description?.slice(0, 100) ?? "Open to early-stage founders",
        }))
      : mockFunding;

  return (
    <AppShell>
      <BackLink to="/businesses" label="Business" />
      <PageHeader title="Funding" sub="Loans, grants and equity" />
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((f) => (
          <article
            key={f.id}
            className="card-lift rounded-lg border bg-card p-4 transition-colors hover:border-border-strong"
          >
            <div className="mb-2 flex items-center justify-between">
              <Tag
                tone={
                  f.kind === "Grant"
                    ? "primary"
                    : f.kind === "Equity"
                      ? "info"
                      : "neutral"
                }
              >
                {f.kind}
              </Tag>
              <span className="tabular font-display font-extrabold text-foreground">
                {f.amount}
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground">{f.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.note}</p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
