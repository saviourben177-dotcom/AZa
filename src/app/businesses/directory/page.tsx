import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SearchBar from "@/components/search-bar";
import BusinessCard from "@/components/business-card";

export const dynamic = "force-dynamic";

export default async function BusinessDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; location?: string; q?: string }>;
}) {
  const { category, location, q } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase.from("businesses").select("*").order("name");
  if (category) query = query.eq("category", category);
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

  return (
    <div className="px-5 pt-7">
      <div className="flex items-center gap-3">
        <Link href="/businesses" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[19px] font-bold text-ink">Business Directory</h1>
      </div>

      <div className="mt-5"><SearchBar placeholder="Search businesses..." /></div>

      {categories.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryLink label="All" active={!category} category={null} />
          {categories.map((cat) => <CategoryLink key={cat} label={cat} active={category === cat} category={cat} />)}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {error && <p className="rounded-card-sm bg-danger-light p-3.5 text-[13px] font-medium text-danger">Couldn&apos;t load businesses right now.</p>}
        {!error && (!businesses || businesses.length === 0) && (
          <div className="rounded-card border border-line-strong bg-surface p-8 text-center shadow-card">
            <p className="text-[13px] text-ink/55">No businesses found.</p>
          </div>
        )}
        {businesses?.map((business) => (
          <BusinessCard key={business.id} business={business} isSaved={savedIds.has(business.id)} isAuthed={!!user} />
        ))}
      </div>
    </div>
  );
}

function CategoryLink({ label, active, category }: { label: string; active: boolean; category: string | null }) {
  return (
    <a
      href={category ? `/businesses/directory?category=${encodeURIComponent(category)}` : "/businesses/directory"}
      className={`shrink-0 rounded-pill border px-4 py-2 text-[13px] font-bold ${active ? "border-aza bg-aza text-white shadow-glow-accent" : "border-line-strong bg-surface text-ink/60"}`}
    >
      {label}
    </a>
  );
}
