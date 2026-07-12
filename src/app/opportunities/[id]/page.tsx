import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeadlinePill from "@/components/deadline-pill";
import SaveButton from "@/components/save-button";
import CategoryIconTile from "@/components/category-icon-tile";
import ShareButton from "@/components/share-button";
import OpportunityCvTailor from "@/components/cv/opportunity-cv-tailor";
import { OPPORTUNITY_CATEGORY_LABELS } from "@/lib/types";
import type { Opportunity } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rawOpportunity, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !rawOpportunity) notFound();

  const opportunity = rawOpportunity as Opportunity;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isSaved = false;
  if (user) {
    const { data } = await supabase
      .from("saved_opportunities")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("opportunity_id", id)
      .maybeSingle();
    isSaved = !!data;
  }

  return (
    <div className="pb-32">
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-dim text-ink/70"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <ShareButton title={opportunity.title} />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-dim">
              <SaveButton opportunityId={opportunity.id} initialSaved={isSaved} isAuthed={!!user} />
            </div>
          </div>
        </div>

        {/* Hero card — dark surface per spec §9.2. No opportunities.logo_url
            exists yet, so a category glyph tile stands in for a real logo. */}
        <div className="relative mt-4 overflow-hidden rounded-lg bg-elevated p-5 shadow-elevated">
          <div className="flex items-center justify-between">
            <CategoryIconTile category={opportunity.category} size={48} />
            {opportunity.curator_verified && (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-aza">
                ✓ Verified
              </span>
            )}
          </div>

          <h1 className="mt-4 text-[20px] font-bold leading-snug text-white">
            {opportunity.title}
          </h1>
          <p className="mt-1 text-[13px] font-medium text-white/60">{opportunity.org}</p>

          {/* Chip row: category + remote status are real fields. job_type and
              "Paid" badge are NOT rendered — opportunities has no job_type or
              paid column, and guessing would misrepresent real listings. */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip label={OPPORTUNITY_CATEGORY_LABELS[opportunity.category]} />
            <Chip label={opportunity.remote ? "Remote" : "On-site"} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[13px] font-medium text-text-secondary">
            {opportunity.location ?? (opportunity.remote ? "Remote" : "Location not specified")}
          </p>
          <DeadlinePill deadline={opportunity.deadline} />
        </div>

        {/* Stat trio (Experience / Level / Applicants) from the mockup is
            omitted entirely — experience_required, level, and
            applicants_count don't exist on opportunities. Showing empty
            placeholders would look broken; omitting is the honest option
            until that migration ships. */}

        <section className="mt-6 rounded-card bg-surface p-5 shadow-card">
          <h2 className="text-[15px] font-semibold text-ink">About the opportunity</h2>
          <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-ink/70">
            {opportunity.description}
          </p>
        </section>

        {opportunity.eligibility && (
          <section className="mt-3 rounded-card bg-surface p-5 shadow-card">
            <h2 className="text-[15px] font-semibold text-ink">Who can apply</h2>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-ink/70">
              {opportunity.eligibility}
            </p>
          </section>
        )}

        {opportunity.tags?.length > 0 && (
          <section className="mt-3 rounded-card bg-surface p-5 shadow-card">
            <h2 className="text-[15px] font-semibold text-ink">Skills</h2>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {opportunity.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-pill bg-paper-dim px-3 py-1.5 text-[12px] font-semibold text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {user && (
          <div className="mt-3">
            <OpportunityCvTailor opportunityId={opportunity.id} />
          </div>
        )}
      </div>

      <div className="fixed bottom-16 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-line bg-surface px-4 py-3.5 shadow-elevated">
        <a
          href={opportunity.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-pill bg-aza py-3.5 text-center text-[15px] font-semibold text-white shadow-glow-accent"
        >
          Apply Now
        </a>
      </div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-pill bg-white/15 px-3 py-1 text-[12px] font-semibold text-white">
      {label}
    </span>
  );
}
