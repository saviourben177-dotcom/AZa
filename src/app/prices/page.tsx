import type { Metadata } from "next";
import { AppShell } from "@/components/aza/app-shell";
import { PageHeader } from "@/components/aza/ui";
import { createClient } from "@/lib/supabase/server";
import { prices as mockPrices } from "@/lib/aza-data";
import { minorToDisplay } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Market prices — Aza",
  description: "Weekly prices for food, fuel and building materials.",
};

export default async function PricesPage() {
  const supabase = await createClient();
  const { data: dbPrices } = await supabase
    .from("prices")
    .select("*")
    .order("category")
    .order("product_name");

  const hasDb = dbPrices && dbPrices.length > 0;

  return (
    <AppShell>
      <PageHeader title="Market prices" sub="Updated weekly · Lagos averages" />
      {hasDb ? (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]">
          {dbPrices.map((p) => (
            <li key={p.id} className="grid grid-cols-[1fr_auto] items-center gap-4 p-4">
              <span>
                <span className="block font-bold">{p.product_name}</span>
                <span className="text-sm text-muted-foreground">
                  {p.category}
                  {p.unit ? ` · per ${p.unit}` : ""}
                </span>
              </span>
              <span className="tabular font-display font-extrabold text-foreground">
                {minorToDisplay(p.price_kobo, p.currency)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]">
          {mockPrices.map((p) => (
            <li key={p.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 p-4">
              <span>
                <span className="block font-bold">{p.product}</span>
                <span className="text-sm text-muted-foreground">{p.category}</span>
              </span>
              <span className="tabular font-display font-extrabold">
                ₦{p.price.toLocaleString()}
              </span>
              <span
                className={cn(
                  "tabular w-14 text-right text-sm font-bold",
                  p.change > 0
                    ? "text-urgent"
                    : p.change < 0
                      ? "text-primary-strong"
                      : "text-muted-foreground",
                )}
              >
                {p.change > 0 ? "+" : ""}
                {p.change}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
