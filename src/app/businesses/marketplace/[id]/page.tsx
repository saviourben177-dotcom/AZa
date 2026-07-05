import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { koboToNaira } from "@/lib/types";
import ListingOwnerControls from "@/components/business/listing-owner-controls";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  sell: "Selling",
  buy: "Looking to buy",
  collaborate: "Collaboration",
  service: "Service",
};

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing, error } = await supabase.from("marketplace_listings").select("*").eq("id", id).single();
  if (error || !listing) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === listing.user_id;

  return (
    <div className="px-5 pt-7">
      <Link href="/businesses/marketplace" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </Link>

      {listing.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.image_url} alt={listing.title} className="mt-4 h-48 w-full rounded-card object-cover shadow-card" />
      )}

      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-pill bg-aza-light px-3 py-1.5 text-[11px] font-bold text-aza">{TYPE_LABELS[listing.listing_type]}</span>
        {listing.status !== "active" && (
          <span className="rounded-pill bg-danger-light px-3 py-1.5 text-[11px] font-bold capitalize text-danger">{listing.status}</span>
        )}
      </div>

      <h1 className="mt-3 font-display text-[21px] font-bold leading-tight text-ink">{listing.title}</h1>
      {listing.price_kobo != null && <p className="mt-1.5 text-[19px] font-bold text-aza tabular">{koboToNaira(listing.price_kobo)}</p>}

      <section className="mt-4 rounded-card border border-line-strong bg-surface p-5 shadow-card">
        <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink/70">{listing.description}</p>
      </section>

      <div className="mt-4 space-y-1.5 text-[12.5px] font-medium text-ink/55">
        {listing.category && <p>Category: {listing.category}</p>}
        {listing.location && <p>Location: {listing.location}</p>}
      </div>

      {listing.status === "active" && (listing.contact_phone || listing.contact_whatsapp) && (
        <div className="mt-6 flex gap-3">
          {listing.contact_whatsapp && (
            <a
              href={`https://wa.me/${listing.contact_whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-pill bg-aza py-3.5 text-center text-[14px] font-bold text-white shadow-glow-accent"
            >
              WhatsApp Seller
            </a>
          )}
          {listing.contact_phone && (
            <a href={`tel:${listing.contact_phone}`} className="flex-1 rounded-pill border border-line-strong bg-surface py-3.5 text-center text-[14px] font-bold text-ink shadow-card">
              Call
            </a>
          )}
        </div>
      )}

      {isOwner && (
        <div className="mt-6">
          <ListingOwnerControls listingId={listing.id} currentStatus={listing.status} />
        </div>
      )}
    </div>
  );
}
