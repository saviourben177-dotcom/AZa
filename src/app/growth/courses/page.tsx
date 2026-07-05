import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createClient();

  const query = supabase.from("skill_resources").select("*, skills(name, category)").order("created_at", { ascending: false });
  const { data: resources } = await query.limit(50);

  const filtered = category
    ? (resources ?? []).filter((r) => (r.skills as unknown as { category: string })?.category === category)
    : resources ?? [];

  const { data: skillRows } = await supabase.from("skills").select("category");
  const categories = Array.from(new Set((skillRows ?? []).map((s) => s.category))).sort();

  return (
    <div className="px-5 pt-7">
      <div className="flex items-center gap-3">
        <Link href="/growth" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[19px] font-bold text-ink">Courses</h1>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CatChip label="All" active={!category} category={null} />
        {categories.map((c) => (
          <CatChip key={c} label={categoryLabel(c)} active={category === c} category={c} />
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {filtered.length === 0 && <p className="text-[13px] text-ink/50">No courses yet in this category.</p>}
        {filtered.map((r) => (
          <a
            key={r.id}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-card-sm border border-line-strong bg-surface p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[14px] font-bold text-ink">{r.title}</p>
              {r.curator_verified && (
                <span className="shrink-0 rounded-pill bg-aza-light px-2 py-0.5 text-[10px] font-bold text-aza">✓</span>
              )}
            </div>
            <p className="mt-1 text-[11.5px] font-medium text-ink/50">
              {(r.skills as unknown as { name: string })?.name} · {r.provider ?? "Unknown provider"}
            </p>
            <p className="mt-2 text-[11px] font-bold text-ink/45">
              <span className="capitalize">{r.level}</span>
              {r.duration_hours ? ` · ${r.duration_hours}hrs` : ""}
              {r.rating ? ` · ★${r.rating}` : ""}
              {r.is_free ? " · Free" : " · Paid"}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}

function categoryLabel(c: string): string {
  return c.replace("_", " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function CatChip({ label, active, category }: { label: string; active: boolean; category: string | null }) {
  return (
    <a
      href={category ? `/growth/courses?category=${category}` : "/growth/courses"}
      className={`shrink-0 rounded-pill border px-4 py-2 text-[13px] font-bold ${
        active ? "border-aza bg-aza text-white shadow-glow-accent" : "border-line-strong bg-surface text-ink/60"
      }`}
    >
      {label}
    </a>
  );
}
