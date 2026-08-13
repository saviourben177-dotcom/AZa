import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SearchBar from "@/components/search-bar";
import BusinessCard from "@/components/business-card";

export const dynamic = "force-dynamic";

export default async function BusinessDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; location?: string; q?: string; near?: string }>;
}) {
  const { category, location, q, near } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userState: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("state").eq("id", user.id).single();
    userState = profile?.state ?? null;
  }

  const nearActive = near === "1" && !!userState;

  let query = supabase.from("businesses").select("*").order("name");
  if (category) query = query.eq("category", category);
  if (nearActive) query = query.eq("state", userState!);
  if (location) query = query.ilike("location", `%${location}%`);
  if (q) {
    const term = q.replace(/[%,]/g, "");
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data: businesses, error } = await query.limit(50);

  const { data: categoryRows } = await supabase.from("businesses").select("category");
  const categories = Array.from(new Set((categoryRows ?? []).map((b) => b.category))).sort();

  let savedIds = new Set<string>();
  if (user) {
    const { data: savedBusinesses } = await supabase.from("saved_businesses").select("business_id").eq("user_id", user.id);
    savedIds = new Set((savedBusinesses ?? []).map((s) => s.business_id));
  }

  const businessIds = (businesses ?? []).map((b) => b.id);
  const ratingsByBusiness = new Map<string, { average: number; count: number }>();
  if (businessIds.length > 0) {
    const { data: ratingRows } = await supabase
      .from("business_ratings")
      .select("business_id, stars")
      .in("business_id", businessIds);
    const grouped = new Map<string, number[]>();
    for (const r of ratingRows ?? []) {
      const arr = grouped.get(r.business_id) ?? [];
      arr.push(r.stars);
      grouped.set(r.business_id, arr);
    }
    for (const [id, stars] of Array.from(grouped)) {
      ratingsByBusiness.set(id, { average: stars.reduce((a: number, b: number) => a + b, 0) / stars.length, count: stars.length });
    }
  }

  return (
    <div className="px-5 pt-7">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link href="/businesses" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <h1 className="font-display text-[19px] font-bold text-ink">Business Directory</h1>
        </div>
        <Link href="/businesses/directory/new" className="rounded-pill bg-aza px-3.5 py-2 text-[12px] font-bold text-white shadow-glow-accent">
          + Add
        </Link>
      </div>

      <div className="mt-5"><SearchBar placeholder="Search businesses..." /></div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {userState ? (
          <NearMeLink active={nearActive} userState={userState} category={category} />
        ) : user ? (
          <Link
            href="/onboarding"
            className="shrink-0 rounded-pill border border-line-strong bg-surface px-4 py-2 text-[13px] font-bold text-ink/50"
          >
            Set your state to see nearby
          </Link>
        ) : null}
        {categories.length > 0 && (
          <>
            <CategoryLink label="All" active={!category} category={null} near={nearActive} />
            {categories.map((cat) => <CategoryLink key={cat} label={cat} active={category === cat} category={cat} near={nearActive} />)}
          </>
        )}
      </div>

      {nearActive && (
        <p className="mt-3 text-[12px] text-ink/45">Showing businesses in {userState}. <Link href="/businesses/directory" className="font-bold text-aza underline">Clear</Link></p>
      )}

      <div className="mt-4 space-y-3">
        {error && <p className="rounded-card-sm bg-danger-light p-3.5 text-[13px] font-medium text-danger">Couldn&apos;t load businesses right now.</p>}
        {!error && (!businesses || businesses.length === 0) && (
          <div className="rounded-card border border-line-strong bg-surface p-8 text-center shadow-card">
            <p className="text-[13px] text-ink/55">No businesses found.</p>
            <Link href="/businesses/directory/new" className="mt-3 inline-block text-[12.5px] font-bold text-aza underline">
              Add the first one
            </Link>
          </div>
        )}
        {businesses?.map((business) => (
          <BusinessCard
            key={business.id}
            business={business}
            isSaved={savedIds.has(business.id)}
            isAuthed={!!user}
            ratingAverage={ratingsByBusiness.get(business.id)?.average ?? 0}
            ratingCount={ratingsByBusiness.get(business.id)?.count ?? 0}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryLink({ label, active, category, near }: { label: string; active: boolean; category: string | null; near: boolean }) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (near) params.set("near", "1");
  const qs = params.toString();
  return (
    <a
      href={`/businesses/directory${qs ? `?${qs}` : ""}`}
      className={`shrink-0 rounded-pill border px-4 py-2 text-[13px] font-bold ${active ? "border-aza bg-aza text-white shadow-glow-accent" : "border-line-strong bg-surface text-ink/60"}`}
    >
      {label}
    </a>
  );
}

function NearMeLink({ active, userState, category }: { active: boolean; userState: string; category?: string }) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (!active) params.set("near", "1");
  const qs = params.toString();
  return (
    <a
      href={`/businesses/directory${qs ? `?${qs}` : ""}`}
      className={`flex shrink-0 items-center gap-1.5 rounded-pill border px-4 py-2 text-[13px] font-bold ${active ? "border-aza bg-aza text-white shadow-glow-accent" : "border-line-strong bg-surface text-ink/60"}`}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="12" cy="9" r="2.3" stroke="currentColor" strokeWidth="2" />
      </svg>
      Near me{active ? ` · ${userState}` : ""}
    </a>
  );
}
