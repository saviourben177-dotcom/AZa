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
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <Link href="/growth" aria-label="Back" className="text-ink/60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[18px] font-extrabold text-ink">Courses</h1>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CatChip label="All" active={!category} category={null} />
        {categories.map((c) => (
          <CatChip key={c} label={categoryLabel(c)} active={category === c} category={c} />
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        {filtered.length === 0 && <p className="text-[13px] text-ink/50">No courses yet in this category.</p>}
        {filtered.map((r) => (
          <a
            key={r.id}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-card border border-line bg-surface p-3.5"
          >
            <div className="flex items-start justify-between">
              <p className="text-[13.5px] font-bold text-ink">{r.title}</p>
              {r.curator_verified && (
                <span className="shrink-0 rounded-full bg-aza-light px-2 py-0.5 text-[10px] font-bold text-aza">✓</span>
              )}
            </div>
            <p className="mt-0.5 text-[11.5px] text-ink/55">
              {(r.skills as unknown as { name: string })?.name} · {r.provider ?? "Unknown provider"}
            </p>
            <p className="mt-1.5 text-[11px] font-medium text-ink/45">
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
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold ${
        active ? "border-aza bg-aza text-white" : "border-line bg-surface text-ink/70"
      }`}
    >
      {label}
    </a>
  );
}
