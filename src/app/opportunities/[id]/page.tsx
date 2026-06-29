import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { OPPORTUNITY_CATEGORY_LABELS } from "@/lib/types";
import DeadlinePill from "@/components/deadline-pill";
import VerifiedBadge from "@/components/verified-badge";
import SaveButton from "@/components/save-button";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: opportunity, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !opportunity) notFound();

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
    <div className="px-4 pt-6">
      <Link href="/" className="text-[13px] font-semibold text-ink/50">
        ← Back to opportunities
      </Link>

      <div className="mt-4 flex items-start justify-between gap-2">
        <span className="rounded-full bg-paper-dim px-2.5 py-1 text-[11px] font-semibold text-ink/60">
          {OPPORTUNITY_CATEGORY_LABELS[opportunity.category as keyof typeof OPPORTUNITY_CATEGORY_LABELS]}
        </span>
        <DeadlinePill deadline={opportunity.deadline} />
      </div>

      <h1 className="mt-3 font-display text-[22px] font-extrabold leading-tight text-ink">
        {opportunity.title}
      </h1>
      <p className="mt-1 text-[14px] font-medium text-ink/60">{opportunity.org}</p>

      <div className="mt-2 flex items-center gap-3">
        {opportunity.curator_verified && <VerifiedBadge />}
        <span className="text-[13px] text-ink/50">
          {opportunity.remote ? "Remote" : opportunity.location ?? "Location not specified"}
        </span>
      </div>

      <section className="mt-5">
        <h2 className="font-display text-[14px] font-bold text-ink">About</h2>
        <p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed text-ink/75">
          {opportunity.description}
        </p>
      </section>

      {opportunity.eligibility && (
        <section className="mt-5">
          <h2 className="font-display text-[14px] font-bold text-ink">
            Who can apply
          </h2>
          <p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed text-ink/75">
            {opportunity.eligibility}
          </p>
        </section>
      )}

      {opportunity.tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {opportunity.tags.map((tag: string) => (
            <span
              key={tag}
              className="rounded-full bg-paper-dim px-2.5 py-1 text-[11px] font-medium text-ink/60"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <a
          href={opportunity.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-card bg-aza py-3 text-center text-[14px] font-bold text-white"
        >
          Apply now
        </a>
        <div className="rounded-card border border-line bg-surface p-2.5">
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
