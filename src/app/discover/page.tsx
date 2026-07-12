import Link from "next/link";
import { getDiscoverQueue, getTrendingQueue, getNewQueue, getNearbyQueue } from "@/lib/actions/discover";
import DiscoverDeck from "@/components/discover-deck";
import DiscoverFilters from "@/components/discover-filters";

export const dynamic = "force-dynamic";

type DiscoverTab = "for-you" | "trending" | "new" | "nearby";

const TABS: { key: DiscoverTab; label: string }[] = [
  { key: "for-you", label: "For You" },
  { key: "trending", label: "Trending" },
  { key: "new", label: "New" },
  { key: "nearby", label: "Nearby" },
];

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tab?: string }>;
}) {
  const { category, tab: rawTab } = await searchParams;
  const tab: DiscoverTab = (TABS.some((t) => t.key === rawTab) ? rawTab : "for-you") as DiscoverTab;

  let opportunities;
  let isAuthed = false;
  let needsRegion = false;

  if (tab === "trending") {
    const result = await getTrendingQueue(category);
    opportunities = result.opportunities;
    isAuthed = result.isAuthed;
  } else if (tab === "new") {
    const result = await getNewQueue(category);
    opportunities = result.opportunities;
    isAuthed = result.isAuthed;
  } else if (tab === "nearby") {
    const result = await getNearbyQueue(category);
    opportunities = result.opportunities;
    isAuthed = result.isAuthed;
    needsRegion = result.needsRegion;
  } else {
    const result = await getDiscoverQueue(category);
    opportunities = result.opportunities;
    isAuthed = result.isAuthed;
  }

  return (
    <div className="px-5 pt-7">
      <header>
        <p className="text-[12px] font-bold uppercase tracking-wide text-aza">Discover</p>
        <h1 className="mt-1 font-display text-[24px] font-bold leading-tight text-ink">Find your next move</h1>
        <p className="mt-1 text-[13px] text-ink/55">Swipe through opportunities picked for you</p>
      </header>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/discover?tab=${t.key}${category ? `&category=${category}` : ""}`}
            className={`shrink-0 rounded-pill border px-4 py-2 text-[13px] font-bold ${
              tab === t.key ? "border-aza bg-aza text-white shadow-glow-accent" : "border-line-strong bg-surface text-ink/60"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-3">
        <DiscoverFilters />
      </div>

      {needsRegion ? (
        <div className="mt-8 rounded-card border border-line-strong bg-surface p-8 text-center shadow-card">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-aza-light text-xl">📍</div>
          <p className="font-display text-[15px] font-bold text-ink">Set your region to see nearby opportunities</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink/55">
            Add your region in your profile so we can match opportunities near you.
          </p>
          <Link href="/profile/edit" className="mt-4 inline-block rounded-pill bg-aza px-5 py-2.5 text-[13px] font-bold text-white shadow-glow-accent">
            Update profile
          </Link>
        </div>
      ) : (
        <DiscoverDeck key={`${tab}-${category ?? "all"}`} opportunities={opportunities} isAuthed={isAuthed} />
      )}
    </div>
  );
}
