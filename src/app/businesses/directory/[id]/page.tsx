import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VerifiedBadge from "@/components/verified-badge";
import StarRatingDisplay from "@/components/business/star-rating-display";
import RatingForm from "@/components/business/rating-form";
import { relativeTime } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: business, error } = await supabase.from("businesses").select("*").eq("id", id).single();
  if (error || !business) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: ratings } = await supabase
    .from("business_ratings")
    .select("id, user_id, stars, comment, created_at, profiles(full_name)")
    .eq("business_id", id)
    .order("created_at", { ascending: false });

  const ratingRows = ratings ?? [];
  const ratingCount = ratingRows.length;
  const average = ratingCount > 0 ? ratingRows.reduce((sum, r) => sum + r.stars, 0) / ratingCount : 0;
  const myRating = user ? ratingRows.find((r) => r.user_id === user.id) : undefined;
  const otherRatings = ratingRows.filter((r) => r.user_id !== user?.id);

  return (
    <div className="px-5 pb-10 pt-7">
      <Link href="/businesses/directory" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </Link>

      <div className="mt-4 flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-card-sm bg-aza-light">
          {business.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logo_url} alt={`${business.name} logo`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-xl font-bold text-aza">
              {business.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[19px] font-bold leading-tight text-ink">{business.name}</h1>
            {business.curator_verified && <VerifiedBadge />}
          </div>
          <p className="mt-1 text-[12.5px] font-medium text-ink/50">
            {business.category}
            {business.location ? ` · ${business.location}` : ""}
          </p>
          <div className="mt-1.5">
            <StarRatingDisplay average={average} count={ratingCount} size="md" />
          </div>
        </div>
      </div>

      {!business.curator_verified && (
        <p className="mt-4 rounded-card-sm bg-paper-dim px-3.5 py-3 text-[11.5px] leading-relaxed text-ink/55">
          This listing hasn&apos;t been verified by Aza yet. Check the reviews below and confirm details before doing business.
        </p>
      )}

      {business.description && (
        <section className="mt-4 rounded-card border border-line-strong bg-surface p-4 shadow-card">
          <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-ink/70">{business.description}</p>
        </section>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {business.whatsapp && (
          <a
            href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-pill bg-aza-light px-4 py-2 text-[12.5px] font-bold text-aza"
          >
            WhatsApp
          </a>
        )}
        {business.phone && (
          <a href={`tel:${business.phone}`} className="rounded-pill bg-paper-dim px-4 py-2 text-[12.5px] font-bold text-ink/70">
            Call
          </a>
        )}
        {business.email && (
          <a href={`mailto:${business.email}`} className="rounded-pill bg-paper-dim px-4 py-2 text-[12.5px] font-bold text-ink/70">
            Email
          </a>
        )}
      </div>

      <div className="mt-7">
        {user ? (
          <RatingForm
            businessId={business.id}
            existingStars={myRating?.stars ?? null}
            existingComment={myRating?.comment ?? null}
          />
        ) : (
          <Link
            href={`/login?next=/businesses/directory/${business.id}`}
            className="block rounded-card border border-line-strong bg-surface p-4 text-center text-[13px] font-bold text-aza shadow-card"
          >
            Log in to rate this business
          </Link>
        )}
      </div>

      <section className="mt-6">
        <p className="text-[13px] font-bold text-ink">
          Reviews {ratingCount > 0 && `(${ratingCount})`}
        </p>
        {otherRatings.length === 0 && !myRating && (
          <p className="mt-2 text-[12.5px] text-ink/50">No reviews yet. Be the first to rate this business.</p>
        )}
        <div className="mt-3 space-y-2.5">
          {otherRatings.map((r) => (
            <div key={r.id} className="rounded-card-sm border border-line-strong bg-surface p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-bold text-ink/80">
                  {(r.profiles as unknown as { full_name: string | null } | null)?.full_name ?? "Aza user"}
                </p>
                <span className="text-[11px] text-ink/40">{relativeTime(r.created_at)}</span>
              </div>
              <div className="mt-1">
                <StarRatingDisplay average={r.stars} count={1} />
              </div>
              {r.comment && <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/65">{r.comment}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
