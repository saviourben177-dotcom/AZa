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
    <div className="px-5 pt-7">
      <header>
        <p className="text-[12px] font-bold uppercase tracking-wide text-aza">Discover</p>
        <h1 className="mt-1 font-display text-[24px] font-bold leading-tight text-ink">Find your next move</h1>
        <p className="mt-1 text-[13px] text-ink/55">Swipe through opportunities picked for you</p>
      </header>

      <div className="mt-4">
        <DiscoverFilters />
      </div>

      <DiscoverDeck key={category ?? "all"} opportunities={opportunities} isAuthed={isAuthed} />
    </div>
  );
}
