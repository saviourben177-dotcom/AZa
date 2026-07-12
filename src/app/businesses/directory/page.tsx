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
        <Link href="/businesses" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-dim text-ink/70">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="text-[19px] font-bold text-ink">Directory</h1>
      </div>

      <div className="mt-4"><SearchBar placeholder="Search businesses..." /></div>

      {categories.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryLink label="All" active={!category} category={null} />
          {categories.map((cat) => <CategoryLink key={cat} label={cat} active={category === cat} category={cat} />)}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {error && <p className="rounded-card bg-danger-light p-3.5 text-[13px] font-medium text-danger">Couldn&apos;t load businesses right now.</p>}
        {!error && (!businesses || businesses.length === 0) && (
          <div className="rounded-card bg-surface p-8 text-center shadow-card">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-aza-light text-xl">🏢</div>
            <p className="text-[14px] font-semibold text-ink">No businesses listed yet</p>
            <p className="mt-1 text-[12.5px] text-text-secondary">Be one of the first to add yours from the Business Hub.</p>
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
      className={`shrink-0 rounded-pill px-4 py-2 text-[13px] font-semibold ${active ? "bg-aza text-white" : "bg-paper-dim text-text-secondary"}`}
    >
      {label}
    </a>
  );
}
