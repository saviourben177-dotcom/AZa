import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { koboToNaira } from "@/lib/types";
import type { MarketplaceListingType } from "@/lib/types";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  sell: "Selling",
  buy: "Looking to buy",
  collaborate: "Collaboration",
  service: "Service",
};

const VALID_LISTING_TYPES: MarketplaceListingType[] = ["sell", "buy", "collaborate", "service"];

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const supabase = await createClient();

  const validType = VALID_LISTING_TYPES.includes(type as MarketplaceListingType)
    ? (type as MarketplaceListingType)
    : undefined;

  let query = supabase.from("marketplace_listings").select("*").eq("status", "active").order("created_at", { ascending: false });
  if (validType) query = query.eq("listing_type", validType);
  const { data: listings } = await query.limit(50);

  return (
    <div className="px-5 pt-7">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/businesses" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <h1 className="font-display text-[19px] font-bold text-ink">Marketplace</h1>
        </div>
        <Link href="/businesses/marketplace/new" className="rounded-pill bg-aza px-4 py-2 text-[12.5px] font-bold text-white shadow-glow-accent">
          + Post
        </Link>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TypeChip label="All" active={!type} type={null} />
        {Object.entries(TYPE_LABELS).map(([value, label]) => (
          <TypeChip key={value} label={label} active={type === value} type={value} />
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {(listings ?? []).length === 0 && (
          <div className="rounded-card border border-line-strong bg-surface p-8 text-center shadow-card">
            <p className="text-[13px] text-ink/55">No listings yet — be the first to post.</p>
          </div>
        )}
        {listings?.map((listing) => (
          <Link key={listing.id} href={`/businesses/marketplace/${listing.id}`} className="block rounded-card-sm border border-line-strong bg-surface p-4 shadow-card">
            <div className="flex gap-3.5">
              {listing.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={listing.image_url} alt={listing.title} className="h-16 w-16 shrink-0 rounded-card-sm object-cover" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-card-sm bg-aza-light font-display text-[14px] font-bold text-aza">
                  {listing.title.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <span className="rounded-pill bg-paper-dim px-2.5 py-1 text-[10px] font-bold text-ink/55">{TYPE_LABELS[listing.listing_type]}</span>
                <p className="mt-1.5 truncate text-[14px] font-bold text-ink">{listing.title}</p>
                <p className="mt-0.5 line-clamp-1 text-[11.5px] text-ink/55">{listing.description}</p>
                {listing.price_kobo != null && (
                  <p className="mt-1.5 text-[13.5px] font-bold text-aza tabular">{koboToNaira(listing.price_kobo)}</p>
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
      className={`shrink-0 rounded-pill border px-4 py-2 text-[13px] font-bold ${active ? "border-aza bg-aza text-white shadow-glow-accent" : "border-line-strong bg-surface text-ink/60"}`}
    >
      {label}
    </a>
  );
}
