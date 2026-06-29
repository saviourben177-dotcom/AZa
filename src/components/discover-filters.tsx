"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { OPPORTUNITY_CATEGORY_LABELS, type OpportunityCategory } from "@/lib/types";

const FEATURED: OpportunityCategory[] = ["job_gig", "scholarship", "internship", "hackathon", "grant", "fellowship", "competition"];

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
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Chip label="All" active={!active} onClick={() => setCategory(null)} />
      {FEATURED.map((cat) => (
        <Chip key={cat} label={OPPORTUNITY_CATEGORY_LABELS[cat]} active={active === cat} onClick={() => setCategory(cat)} />
      ))}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
        active ? "border-aza bg-aza text-white" : "border-line bg-surface text-ink/70"
      }`}
    >
      {label}
    </button>
  );
}
