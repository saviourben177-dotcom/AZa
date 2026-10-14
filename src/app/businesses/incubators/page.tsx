import type { Metadata } from "next";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";
import { incubators as mockIncubators } from "@/lib/aza-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Incubators — Aza",
  description: "Incubators and accelerators across Africa, with intake dates.",
};

export default async function IncubatorsPage() {
  const supabase = await createClient();
  const { data: dbIncubators } = await supabase
    .from("incubators")
    .select("*")
    .order("deadline", { ascending: true, nullsFirst: false });

  const list =
    dbIncubators && dbIncubators.length > 0
      ? dbIncubators.map((i) => ({
          id: i.id,
          name: i.name,
          mark: i.name.slice(0, 2).toUpperCase(),
          location: i.location ?? "Lagos, Nigeria",
          focus: i.focus_area ?? "Tech & General",
          intake: i.deadline ? new Date(i.deadline).toLocaleDateString() : "Rolling",
        }))
      : mockIncubators;

  return (
    <AppShell>
      <BackLink to="/businesses" label="Business" />
      <PageHeader title="Incubators" sub="Programmes that back early founders" />
      <div className="grid gap-3 md:grid-cols-3">
        {list.map((i) => (
          <article
            key={i.id}
            className="card-lift flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-border-strong"
          >
            <span className="emboss grid size-11 place-items-center rounded-md border font-display text-sm font-bold text-foreground">
              {i.mark}
            </span>
            <div>
              <h3 className="text-base font-semibold text-foreground">{i.name}</h3>
              <p className="text-sm text-muted-foreground">
                {i.location} · {i.focus}
              </p>
            </div>
            <div className="mt-auto">
              <Tag tone="primary">Intake: {i.intake}</Tag>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
