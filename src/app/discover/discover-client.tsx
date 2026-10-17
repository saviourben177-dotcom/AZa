"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/aza/app-shell";
import { OpportunityCard, PageHeader } from "@/components/aza/ui";
import type { Opportunity } from "@/lib/aza-data";
import { cn } from "@/lib/utils";

const cats = ["All", "Grant", "Scholarship", "Fellowship", "Hackathon", "Internship", "Competition"];

export default function DiscoverClient({
  initialOpportunities,
}: {
  initialOpportunities: Opportunity[];
}) {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");

  const list = initialOpportunities
    .filter((o) => cat === "All" || o.category.toLowerCase() === cat.toLowerCase())
    .filter((o) => (o.title + o.org).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <AppShell>
      <PageHeader title="Discover" sub={`${list.length} open opportunities, soonest deadline first`} />
      <label className="relative mb-3 block">
        <span className="sr-only">Search opportunities</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title or organisation"
          className="h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={cat === c}
            onClick={() => setCat(c)}
            className={cn(
              "h-11 shrink-0 rounded-md border px-3.5 text-sm font-medium transition-colors",
              cat === c
                ? "border-foreground bg-foreground text-background"
                : "bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((o) => (
          <OpportunityCard key={o.id} o={o} />
        ))}
      </div>
      {list.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nothing matches yet. Try another category.
        </p>
      )}
    </AppShell>
  );
}
