import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { minorToDisplay } from "@/lib/types";
import type { MarketplaceListingType } from "@/lib/types";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<MarketplaceListingType, string> = {
  sell: "Sell",
  buy: "Buy",
  collaborate: "Collaborate",
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

  let query = supabase
    .from("marketplace_listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (validType) query = query.eq("listing_type", validType);
  const { data: listings } = await query.limit(50);

  return (
    <AppShell>
      <BackLink to="/businesses" label="Business" />
      <PageHeader
        title="Marketplace"
        sub="Trade with founders near you"
        action={
          <Link href="/businesses/marketplace/new" className={btn.primary}>
            Post a listing
          </Link>
        }
      />

      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        <TypeChip label="All" active={!validType} type={null} />
        {Object.entries(TYPE_LABELS).map(([value, label]) => (
          <TypeChip key={value} label={label} active={validType === value} type={value} />
        ))}
      </div>

      {(listings ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-semibold">No listings yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Be the first to post one.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {listings!.map((listing) => (
            <Link
              key={listing.id}
              href={`/businesses/marketplace/${listing.id}`}
              className="card-lift flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-border-strong"
            >
              <div className="flex items-center justify-between gap-2">
                <Tag tone={listing.listing_type === "sell" ? "primary" : listing.listing_type === "collaborate" ? "info" : "neutral"}>
                  {TYPE_LABELS[listing.listing_type]}
                </Tag>
                {listing.price_kobo != null && (
                  <span className="tabular font-display font-extrabold text-foreground">
                    {minorToDisplay(listing.price_kobo, listing.currency)}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                {listing.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.image_url}
                    alt={listing.title}
                    className="h-14 w-14 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-primary-soft font-display text-sm font-bold text-primary-strong">
                    {listing.title.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-foreground">{listing.title}</h3>
                  <p className="line-clamp-2 text-sm text-foreground/80">{listing.description}</p>
                </div>
              </div>
              {listing.location && (
                <p className="mt-auto pt-1 text-sm text-muted-foreground">{listing.location}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function TypeChip({ label, active, type }: { label: string; active: boolean; type: string | null }) {
  return (
    <Link
      href={type ? `/businesses/marketplace?type=${type}` : "/businesses/marketplace"}
      className={`h-11 shrink-0 rounded-md border px-3.5 text-sm font-medium flex items-center ${
        active
          ? "border-primary bg-primary-soft font-semibold text-primary-strong"
          : "bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
