"use client";

import { Search, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/aza/app-shell";
import { OpportunityCard, PageHeader } from "@/components/aza/ui";
import FeaturedOpportunityCard from "@/components/aza/featured-opportunity-card";
import type { Opportunity } from "@/lib/aza-data";
import type { FeaturedOpportunity } from "@/lib/aza/featured-opportunities";
import type { ApplicationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const cats = ["All", "Featured", "Grant", "Scholarship", "Fellowship", "Hackathon", "Internship", "Competition"];

export default function DiscoverClient({
  initialOpportunities,
  featured,
  featuredStatusMap,
  signedIn,
}: {
  initialOpportunities: Opportunity[];
  featured: FeaturedOpportunity[];
  featuredStatusMap: Record<string, ApplicationStatus>;
  signedIn: boolean;
}) {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");

  const list = initialOpportunities
    .filter((o) => cat === "All" || (cat !== "Featured" && o.category.toLowerCase() === cat.toLowerCase()))
    .filter((o) => (o.title + o.org).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      // Rolling-basis (null deadline) opportunities sort after everything
      // with a real deadline, not at a misleading fixed position.
      if (a.daysLeft === null && b.daysLeft === null) return 0;
      if (a.daysLeft === null) return 1;
      if (b.daysLeft === null) return -1;
      return a.daysLeft - b.daysLeft;
    });

  const featuredList = featured.filter((f) => (f.title + f.description).toLowerCase().includes(q.toLowerCase()));

  const showFeatured = cat === "All" || cat === "Featured";
  const showMain = cat !== "Featured";

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

      {showFeatured && cat === "Featured" && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary-soft p-3 text-xs text-primary-strong">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <p>
            These are vetted external platforms — some links support Aza at no extra cost to you. Status here is
            self-reported; Aza has no API access to these platforms, so nothing syncs automatically.
          </p>
        </div>
      )}

      {showFeatured && featuredList.length > 0 && (
        <div className={cat === "Featured" ? "mb-10" : "mb-10"}>
          {cat === "All" && <h2 className="mb-3 text-lg font-display font-bold text-foreground">Featured</h2>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredList.map((f) => (
              <FeaturedOpportunityCard
                key={f.id}
                featured={f}
                status={featuredStatusMap[f.id] ?? "saved"}
                signedIn={signedIn}
              />
            ))}
          </div>
        </div>
      )}

      {showMain && (
        <>
          {cat === "All" && list.length > 0 && (
            <h2 className="mb-3 text-lg font-display font-bold text-foreground">All opportunities</h2>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((o) => (
              <OpportunityCard key={o.id} o={o} />
            ))}
          </div>
          {list.length === 0 && cat !== "Featured" && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nothing matches yet. Try another category.
            </p>
          )}
        </>
      )}

      {cat === "Featured" && featuredList.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">No featured platforms match your search.</p>
      )}
    </AppShell>
  );
}
