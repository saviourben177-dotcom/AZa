import { notFound } from "next/navigation";
import { BadgeCheck, Phone } from "lucide-react";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn, Stars } from "@/components/aza/kit";
import { Tag } from "@/components/aza/ui";
import { businesses as mockBusinesses } from "@/lib/aza-data";
import { createClient } from "@/lib/supabase/server";
import { BusinessRatingSection } from "./rating-section";

export const dynamic = "force-dynamic";

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: dbBusiness } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // A real business id that simply has no row yet (new accounts, fresh
  // database) is a genuine 404, not a reason to show demo content —
  // mock fallback is only for ids that were never real to begin with
  // (prototype links that predate real data).
  const mock = !dbBusiness ? mockBusinesses.find((x) => x.id === id) : null;
  if (!dbBusiness && !mock) {
    notFound();
  }

  let business;
  if (dbBusiness) {
    const { data: ratings } = await supabase
      .from("business_ratings")
      .select("stars")
      .eq("business_id", id);
    const ratingValues = (ratings ?? []).map((r) => r.stars);
    const avgRating =
      ratingValues.length > 0 ? ratingValues.reduce((a, c) => a + c, 0) / ratingValues.length : 0;

    business = {
      id: dbBusiness.id,
      name: dbBusiness.name,
      mark: dbBusiness.name.slice(0, 2).toUpperCase(),
      category: dbBusiness.category ?? "Services",
      location: dbBusiness.location ?? "Nigeria",
      rating: Math.round(avgRating * 10) / 10,
      reviews: ratingValues.length,
      description: dbBusiness.description ?? "",
      phone: dbBusiness.phone ?? null,
      verified: true,
    };
  } else {
    business = mock!;
  }

  return (
    <AppShell>
      <BackLink to="/businesses/directory" label="Directory" />
      <div className="max-w-2xl">
        <div className="mb-4 flex items-center gap-4">
          <span className="emboss grid size-16 place-items-center rounded-lg border font-display text-xl font-bold text-foreground">
            {business.mark}
          </span>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-display font-bold text-foreground">
              {business.name}
              {business.verified && (
                <BadgeCheck
                  aria-label="Verified"
                  className="size-5 text-primary"
                />
              )}
            </h1>
            <p className="text-sm text-muted-foreground">{business.location}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Tag>{business.category}</Tag>
          {business.reviews > 0 ? (
            <>
              <Stars value={Math.round(business.rating)} />
              <span className="text-sm text-foreground">
                <b className="tabular font-bold">{business.rating}</b> · {business.reviews} reviews
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No reviews yet</span>
          )}
        </div>

        <p className="mb-6 leading-relaxed text-foreground">{business.description}</p>

        {business.phone && (
          <a href={`tel:${business.phone}`} className={btn.primary}>
            <Phone className="size-4" /> Call {business.phone}
          </a>
        )}

        <BusinessRatingSection businessId={business.id} />
      </div>
    </AppShell>
  );
}
