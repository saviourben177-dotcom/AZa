import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn, Empty, Stars } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Business directory — Aza",
  description: "Find and rate local businesses run by young founders.",
};

export default async function BusinessDirectoryPage() {
  const supabase = await createClient();
  const { data: dbBusinesses } = await supabase
    .from("businesses")
    .select("*")
    .order("name")
    .limit(50);

  const businesses = dbBusinesses ?? [];
  const { data: ratingsRaw } =
    businesses.length > 0
      ? await supabase
          .from("business_ratings")
          .select("business_id, stars")
          .in("business_id", businesses.map((b) => b.id))
      : { data: [] as { business_id: string; stars: number }[] };

  const ratingsByBusiness = new Map<string, number[]>();
  for (const r of ratingsRaw ?? []) {
    const arr = ratingsByBusiness.get(r.business_id) ?? [];
    arr.push(r.stars);
    ratingsByBusiness.set(r.business_id, arr);
  }

  const list = businesses.map((b) => {
    const ratings = ratingsByBusiness.get(b.id) ?? [];
    const avgRating = ratings.length > 0 ? ratings.reduce((a, c) => a + c, 0) / ratings.length : 0;
    return {
      id: b.id,
      name: b.name,
      mark: b.name.slice(0, 2).toUpperCase(),
      category: b.category ?? "Services",
      location: b.location ?? "Nigeria",
      rating: Math.round(avgRating * 10) / 10,
      reviews: ratings.length,
      description: b.description ?? "",
      verified: true,
    };
  });

  return (
    <AppShell>
      <BackLink to="/businesses" label="Business" />
      <PageHeader
        title="Directory"
        sub="Local businesses near you"
        action={
          <Link href="/businesses/directory/new" className={btn.primary}>
            List yours
          </Link>
        }
      />
      {list.length === 0 ? (
        <Empty
          title="No businesses listed yet"
          sub="Be the first to add yours to the directory."
          action={
            <Link href="/businesses/directory/new" className={btn.primary}>
              List yours
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => (
            <Link
              key={b.id}
              href={`/businesses/directory/${b.id}`}
              className="card-lift flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-border-strong"
            >
              <div className="flex items-center gap-3">
                <span className="emboss grid size-11 place-items-center rounded-md border font-display text-sm font-bold text-foreground">
                  {b.mark}
                </span>
                <div className="min-w-0">
                  <h3 className="flex items-center gap-1 truncate text-base font-semibold text-foreground">
                    {b.name}
                    {b.verified && (
                      <BadgeCheck
                        aria-label="Verified"
                        className="size-4 shrink-0 text-primary"
                      />
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">{b.location}</p>
                </div>
              </div>
              <p className="line-clamp-2 text-sm text-foreground/80">{b.description}</p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <Tag>{b.category}</Tag>
                {b.reviews > 0 ? (
                  <span className="flex items-center gap-1 text-sm text-foreground">
                    <Stars value={Math.round(b.rating)} />
                    <span className="tabular font-bold">{b.rating}</span>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">No reviews yet</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
