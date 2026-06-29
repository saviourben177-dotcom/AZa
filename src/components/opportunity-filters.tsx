"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { OPPORTUNITY_CATEGORY_LABELS, type OpportunityCategory } from "@/lib/types";

const CATEGORIES = Object.keys(OPPORTUNITY_CATEGORY_LABELS) as OpportunityCategory[];

export default function OpportunityFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category");
  const sort = searchParams.get("sort") ?? "deadline";

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterChip
          label="All"
          active={!activeCategory}
          onClick={() => updateParam("category", null)}
        />
        {CATEGORIES.map((cat) => (
          <FilterChip
            key={cat}
            label={OPPORTUNITY_CATEGORY_LABELS[cat]}
            active={activeCategory === cat}
            onClick={() => updateParam("category", cat)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 text-[12px]">
        <span className="text-ink/50">Sort:</span>
        <button
          onClick={() => updateParam("sort", "deadline")}
          className={`font-semibold ${sort === "deadline" ? "text-aza" : "text-ink/50"}`}
        >
          Closing soon
        </button>
        <span className="text-ink/30">·</span>
        <button
          onClick={() => updateParam("sort", "newest")}
          className={`font-semibold ${sort === "newest" ? "text-aza" : "text-ink/50"}`}
        >
          Newest
        </button>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
        active
          ? "border-aza bg-aza text-white"
          : "border-line bg-surface text-ink/70"
      }`}
    >
      {label}
    </button>
  );
}
