import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { koboToNaira } from "@/lib/types";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  sell: "Products",
  buy: "Looking to buy",
  collaborate: "Collab",
  service: "Services",
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
        <h1 className="text-[22px] font-bold leading-tight text-ink">Marketplace</h1>
        <Link href="/businesses/marketplace/new" className="rounded-pill bg-aza px-4 py-2 text-[12.5px] font-semibold text-white shadow-glow-accent">
          + Post
        </Link>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TypeChip label="All" active={!type} type={null} />
        {Object.entries(TYPE_LABELS).map(([value, label]) => (
          <TypeChip key={value} label={label} active={type === value} type={value} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {(listings ?? []).length === 0 && (
          <div className="col-span-2 rounded-card bg-surface p-8 text-center shadow-card">
            <p className="text-[13px] text-text-secondary">No listings yet — be the first to post.</p>
          </div>
        )}
        {listings?.map((listing) => (
          <Link key={listing.id} href={`/businesses/marketplace/${listing.id}`} className="block overflow-hidden rounded-card bg-surface shadow-card">
            {listing.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.image_url} alt={listing.title} className="h-28 w-full object-cover" />
            ) : (
              <div className="flex h-28 w-full items-center justify-center bg-aza-light text-[22px] font-bold text-aza">
                {listing.title.charAt(0)}
              </div>
            )}
            <div className="p-3">
              <p className="line-clamp-2 text-[12.5px] font-semibold leading-snug text-ink">{listing.title}</p>
              {listing.price_kobo != null ? (
                <p className="mt-1 text-[13px] font-bold text-aza tabular">{koboToNaira(listing.price_kobo)}</p>
              ) : (
                <p className="mt-1 text-[11px] font-semibold text-text-tertiary">{TYPE_LABELS[listing.listing_type]}</p>
              )}
              {/* No rating column on marketplace_listings — star rating from
                  the mockup is intentionally omitted rather than fabricated. */}
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
      className={`shrink-0 rounded-pill px-4 py-2 text-[13px] font-semibold ${active ? "bg-aza text-white" : "bg-paper-dim text-text-secondary"}`}
    >
      {label}
    </a>
  );
}
