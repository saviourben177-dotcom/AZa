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
        <div>
          <h1 className="font-display text-[20px] font-extrabold text-ink">Discover opportunities</h1>
        </div>
      </header>

      <DiscoverFilters />

      <DiscoverDeck key={category ?? "all"} opportunities={opportunities} isAuthed={isAuthed} />
    </div>
  );
}
