import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { koboToNaira } from "@/lib/types";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  sell: "Selling",
  buy: "Looking to buy",
  collaborate: "Collaboration",
  service: "Service",
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("marketplace_listings").select("*").eq("status", "active").order("created_at", { ascending: false });
  if (type) query = query.eq("listing_type", type);
  const { data: listings } = await query.limit(50);

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/businesses" aria-label="Back" className="text-ink/60">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <h1 className="font-display text-[18px] font-extrabold text-ink">Marketplace</h1>
        </div>
        <Link href="/businesses/marketplace/new" className="rounded-full bg-aza px-3 py-1.5 text-[12px] font-bold text-white">
          + Post
        </Link>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TypeChip label="All" active={!type} type={null} />
        {Object.entries(TYPE_LABELS).map(([value, label]) => (
          <TypeChip key={value} label={label} active={type === value} type={value} />
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {(listings ?? []).length === 0 && (
          <div className="rounded-card border border-dashed border-line bg-surface/60 p-8 text-center">
            <p className="text-[13px] text-ink/60">No listings yet — be the first to post.</p>
          </div>
        )}
        {listings?.map((listing) => (
          <Link key={listing.id} href={`/businesses/marketplace/${listing.id}`} className="block rounded-card border border-line bg-surface p-3.5">
            <div className="flex gap-3">
              {listing.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={listing.image_url} alt={listing.title} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-paper-dim text-[12px] font-bold text-ink/30">
                  {listing.title.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <span className="rounded-full bg-paper-dim px-2 py-0.5 text-[10px] font-semibold text-ink/55">{TYPE_LABELS[listing.listing_type]}</span>
                <p className="mt-1 truncate text-[13.5px] font-bold text-ink">{listing.title}</p>
                <p className="mt-0.5 line-clamp-1 text-[11.5px] text-ink/55">{listing.description}</p>
                {listing.price_kobo != null && (
                  <p className="mt-1 text-[13px] font-bold text-aza tabular">{koboToNaira(listing.price_kobo)}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function TypeChip({ label, active, type }: { label: string; active: boolean; type: string | null }) {
  return (
    <a
      href={type ? `/businesses/marketplace?type=${type}` : "/businesses/marketplace"}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold ${active ? "border-aza bg-aza text-white" : "border-line bg-surface text-ink/70"}`}
    >
      {label}
    </a>
  );
}
