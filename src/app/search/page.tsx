import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SearchInput from "@/components/search/search-input";
import { OPPORTUNITY_CATEGORY_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  if (!q || !q.trim()) {
    return (
      <div className="px-4 pt-6">
        <SearchInput initialValue="" />
        <ExploreLinks />
      </div>
    );
  }

  const term = q.trim().replace(/[%,]/g, "");

  const [{ data: opportunities }, { data: ideas }, { data: businesses }, { data: resources }] = await Promise.all([
    supabase.from("opportunities").select("*").or(`title.ilike.%${term}%,org.ilike.%${term}%`).limit(8),
    supabase.from("ideas").select("id, title, description, category").ilike("title", `%${term}%`).limit(8),
    supabase.from("businesses").select("id, name, category").ilike("name", `%${term}%`).limit(8),
    supabase.from("skill_resources").select("id, title, provider").ilike("title", `%${term}%`).limit(8),
  ]);

  const totalResults =
    (opportunities?.length ?? 0) + (ideas?.length ?? 0) + (businesses?.length ?? 0) + (resources?.length ?? 0);

  return (
    <div className="px-4 pt-6">
      <SearchInput initialValue={q} />

      <div className="mt-5">
        {totalResults === 0 && (
          <div className="rounded-card bg-surface p-8 text-center shadow-card">
            <p className="text-[13px] text-text-secondary">No results for &quot;{q}&quot;.</p>
          </div>
        )}

        {opportunities && opportunities.length > 0 && (
          <ResultSection title="Opportunities">
            {opportunities.map((o) => (
              <ResultRow key={o.id} href={`/opportunities/${o.id}`} title={o.title} subtitle={`${o.org} · ${OPPORTUNITY_CATEGORY_LABELS[o.category as keyof typeof OPPORTUNITY_CATEGORY_LABELS]}`} />
            ))}
          </ResultSection>
        )}

        {ideas && ideas.length > 0 && (
          <ResultSection title="Ideas">
            {ideas.map((i) => (
              <ResultRow key={i.id} href={`/growth/ideas/${i.id}`} title={i.title} subtitle={i.category ?? "Idea"} />
            ))}
          </ResultSection>
        )}

        {businesses && businesses.length > 0 && (
          <ResultSection title="Businesses">
            {businesses.map((b) => (
              <ResultRow key={b.id} href="/businesses/directory" title={b.name} subtitle={b.category} />
            ))}
          </ResultSection>
        )}

        {resources && resources.length > 0 && (
          <ResultSection title="Skills & Resources">
            {resources.map((r) => (
              <ResultRow key={r.id} href="/growth/courses" title={r.title} subtitle={r.provider ?? "Resource"} />
            ))}
          </ResultSection>
        )}
      </div>
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-tertiary">{title}</h2>
      <div className="mt-2.5 space-y-2.5">{children}</div>
    </section>
  );
}

function ResultRow({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <Link href={href} className="block rounded-card bg-surface p-3.5 shadow-card">
      <p className="truncate text-[13.5px] font-semibold text-ink">{title}</p>
      <p className="truncate text-[11.5px] font-medium text-text-tertiary">{subtitle}</p>
    </Link>
  );
}

const EXPLORE = [
  { href: "/discover", label: "Opportunities" },
  { href: "/growth/skills", label: "Skills & Resources" },
  { href: "/growth/ideas", label: "Ideas" },
  { href: "/businesses/directory", label: "Businesses" },
  { href: "/businesses/incubators", label: "Incubators" },
];

function ExploreLinks() {
  return (
    <section className="mt-7">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-tertiary">Explore</h2>
      <div className="mt-2.5 space-y-2.5">
        {EXPLORE.map((e) => (
          <Link key={e.href} href={e.href} className="flex items-center justify-between rounded-card bg-surface px-4 py-3.5 shadow-card">
            <span className="text-[13.5px] font-medium text-ink">{e.label}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="m9 6 6 6-6 6" stroke="rgb(var(--text-tertiary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}
