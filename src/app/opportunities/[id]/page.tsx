import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import DeadlinePill from "@/components/deadline-pill";
import VerifiedBadge from "@/components/verified-badge";
import SaveButton from "@/components/save-button";
import OpportunityCvTailor from "@/components/cv/opportunity-cv-tailor";
import { CATEGORY_IMAGE, CATEGORY_EYEBROW } from "@/lib/category-visuals";
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
    <div className="pb-28">
      <div className="relative h-56 w-full">
        <Image
          src={CATEGORY_IMAGE[opportunity.category]}
          alt=""
          fill
          sizes="448px"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/10 to-black/30" />

        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
            aria-label="Back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          {opportunity.curator_verified && <VerifiedBadge />}
        </div>

        <div className="absolute bottom-4 left-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-card-sm bg-surface shadow-card">
          {opportunity.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={opportunity.logo_url} alt={`${opportunity.org} logo`} className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-xl font-bold text-aza">{opportunity.org.charAt(0)}</span>
          )}
        </div>

        <div className="absolute -bottom-4 right-4">
          <DeadlinePill deadline={opportunity.deadline} />
        </div>
      </div>

      <div className="px-5 pt-7">
        <span className="rounded-pill bg-aza-light px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-aza">
          {CATEGORY_EYEBROW[opportunity.category]}
        </span>

        <h1 className="mt-3 font-display text-[23px] font-bold leading-tight text-ink">
          {opportunity.title}
        </h1>

        {(opportunity.job_type || opportunity.paid !== null || opportunity.level) && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opportunity.job_type && (
              <span className="rounded-pill bg-paper-dim px-2.5 py-1 text-[11px] font-bold capitalize text-ink/65">
                {opportunity.job_type.replace("_", " ")}
              </span>
            )}
            {opportunity.remote && (
              <span className="rounded-pill bg-paper-dim px-2.5 py-1 text-[11px] font-bold text-ink/65">
                On-site
              </span>
            )}
            {opportunity.paid === true && (
              <span className="rounded-pill bg-aza-light px-2.5 py-1 text-[11px] font-bold text-aza">
                Paid
              </span>
            )}
          </div>
        )}

        <div className="mt-2 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-aza" />
          <p className="text-[13.5px] font-semibold text-ink/60">{opportunity.org}</p>
        </div>

        <p className="mt-2 text-[13px] font-medium text-ink/45">
          📍 {opportunity.remote ? "Remote" : opportunity.location ?? "Location not specified"}
        </p>

        {opportunity.salary_range && (
          <p className="mt-2 text-[14px] font-bold text-ink">{opportunity.salary_range}</p>
        )}

        {(opportunity.experience_required || opportunity.level || opportunity.applicants_count !== null) && (
          <div className="mt-4 grid grid-cols-3 divide-x divide-line rounded-card border border-line-strong bg-surface shadow-card">
            <StatCell label="Experience" value={opportunity.experience_required} />
            <StatCell label="Level" value={opportunity.level} capitalize />
            <StatCell
              label="Applicants"
              value={opportunity.applicants_count !== null ? String(opportunity.applicants_count) : null}
            />
          </div>
        )}

        <section className="mt-6 rounded-card border border-line-strong bg-surface p-5 shadow-card">
          <h2 className="font-display text-[15px] font-bold text-ink">About</h2>
          <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-ink/70">
            {opportunity.description}
          </p>
        </section>

        {opportunity.eligibility && (
          <section className="mt-4 rounded-card border border-line-strong bg-surface p-5 shadow-card">
            <h2 className="font-display text-[15px] font-bold text-ink">Who can apply</h2>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-ink/70">
              {opportunity.eligibility}
            </p>
          </section>
        )}

        {opportunity.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {opportunity.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-lg bg-aza-light px-2.5 py-1 text-[11px] font-bold text-aza"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {user && (
          <div className="mt-5">
            <OpportunityCvTailor opportunityId={opportunity.id} />
          </div>
        )}
      </div>

      <div className="fixed bottom-[76px] left-1/2 z-30 flex w-full max-w-md -translate-x-1/2 items-center gap-3 border-t border-line bg-paper/95 px-5 py-4 backdrop-blur-xl">
        <a
          href={opportunity.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-pill bg-aza py-3.5 text-center text-[14.5px] font-bold text-white shadow-glow-accent"
        >
          Apply now
        </a>
        <div className="rounded-pill border border-line-strong bg-surface p-3 shadow-card">
          <SaveButton
            opportunityId={opportunity.id}
            initialSaved={isSaved}
            isAuthed={!!user}
          />
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, capitalize }: { label: string; value: string | null; capitalize?: boolean }) {
  return (
    <div className="px-2 py-3 text-center">
      <p className={`text-[13px] font-bold text-ink ${capitalize ? "capitalize" : ""}`}>{value ?? "—"}</p>
      <p className="mt-0.5 text-[10px] font-semibold text-ink/45">{label}</p>
    </div>
  );
}
