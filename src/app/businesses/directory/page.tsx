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

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <Link href="/businesses" aria-label="Back" className="text-ink/60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[18px] font-extrabold text-ink">Business Directory</h1>
      </div>

      <div className="mt-4"><SearchBar placeholder="Search businesses..." /></div>

      {categories.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryLink label="All" active={!category} category={null} />
          {categories.map((cat) => <CategoryLink key={cat} label={cat} active={category === cat} category={cat} />)}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {error && <p className="rounded-card bg-danger-light p-3 text-[13px] text-danger">Couldn&apos;t load businesses right now.</p>}
        {!error && (!businesses || businesses.length === 0) && (
          <div className="rounded-card border border-dashed border-line bg-surface/60 p-8 text-center">
            <p className="text-[13px] text-ink/60">No businesses found.</p>
          </div>
        )}
        {businesses?.map((business) => <BusinessCard key={business.id} business={business} />)}
      </div>
    </div>
  );
}

function CategoryLink({ label, active, category }: { label: string; active: boolean; category: string | null }) {
  return (
    <a
      href={category ? `/businesses/directory?category=${encodeURIComponent(category)}` : "/businesses/directory"}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold ${active ? "border-aza bg-aza text-white" : "border-line bg-surface text-ink/70"}`}
    >
      {label}
    </a>
  );
}
