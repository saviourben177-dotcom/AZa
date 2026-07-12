import Link from "next/link";
import { getDiscoverQueue } from "@/lib/actions/discover";
import DiscoverDeck from "@/components/discover-deck";
import DiscoverFilters from "@/components/discover-filters";

export const dynamic = "force-dynamic";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const { opportunities, isAuthed } = await getDiscoverQueue(category);

  return (
    <div className="px-4 pt-6">
      <header className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold leading-tight text-ink">Discover</h1>
        <Link href="/search" aria-label="Search" className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-dim text-ink/70">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </Link>
      </header>

      <div className="mt-4">
        <DiscoverFilters />
      </div>

      <DiscoverDeck key={category ?? "all"} opportunities={opportunities} isAuthed={isAuthed} />
    </div>
  );
}
