"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { OPPORTUNITY_CATEGORY_LABELS, type OpportunityCategory } from "@/lib/types";

const FEATURED: OpportunityCategory[] = ["job_gig", "scholarship", "internship", "hackathon", "grant", "fellowship", "competition"];

/**
 * "Trending / New / Nearby" tabs appear in the mockup but have no backing
 * ranking/sort query yet (screen-mapping doc flags this as a query-logic
 * gap, not a schema gap). Only "For you" is wired to real data for now —
 * the others are visible but disabled with a short explanation, rather than
 * silently doing nothing or faking a sort order.
 */
const SORT_TABS = [
  { key: "for-you", label: "For you", enabled: true },
  { key: "trending", label: "Trending", enabled: false },
  { key: "new", label: "New", enabled: false },
  { key: "nearby", label: "Nearby", enabled: false },
] as const;

export default function DiscoverFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("category");

  function setCategory(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("category", value);
    else params.delete("category");
    router.push(`/discover?${params.toString()}`);
  }

  return (
    <div>
      <div className="flex rounded-pill bg-paper-dim p-1">
        {SORT_TABS.map((tab) => (
          <button
            key={tab.key}
            disabled={!tab.enabled}
            title={tab.enabled ? undefined : "Coming soon"}
            className={`flex-1 rounded-pill py-2 text-[13px] font-semibold transition-colors ${
              tab.enabled
                ? "bg-aza text-white"
                : "text-text-tertiary disabled:cursor-not-allowed"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip label="All" active={!active} onClick={() => setCategory(null)} />
        {FEATURED.map((cat) => (
          <Chip key={cat} label={OPPORTUNITY_CATEGORY_LABELS[cat]} active={active === cat} onClick={() => setCategory(cat)} />
        ))}
      </div>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-pill px-4 py-2 text-[13px] font-semibold transition-colors ${
        active
          ? "bg-aza text-white"
          : "bg-paper-dim text-text-secondary"
      }`}
    >
      {label}
    </button>
  );
}
