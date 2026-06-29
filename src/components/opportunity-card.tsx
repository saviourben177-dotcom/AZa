import Link from "next/link";
import type { Opportunity } from "@/lib/types";
import { OPPORTUNITY_CATEGORY_LABELS } from "@/lib/types";
import DeadlinePill from "@/components/deadline-pill";
import VerifiedBadge from "@/components/verified-badge";
import SaveButton from "@/components/save-button";

export default function OpportunityCard({
  opportunity,
  isSaved,
  isAuthed,
}: {
  opportunity: Opportunity;
  isSaved: boolean;
  isAuthed: boolean;
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full bg-paper-dim px-2.5 py-1 text-[11px] font-semibold text-ink/60">
          {OPPORTUNITY_CATEGORY_LABELS[opportunity.category]}
        </span>
        <DeadlinePill deadline={opportunity.deadline} />
      </div>

      <Link href={`/opportunities/${opportunity.id}`} className="mt-2.5 block">
        <h3 className="font-display text-[16px] font-bold leading-snug text-ink">
          {opportunity.title}
        </h3>
        <p className="mt-0.5 text-[13px] text-ink/60">{opportunity.org}</p>
      </Link>

      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink/70">
        {opportunity.description}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {opportunity.curator_verified && <VerifiedBadge />}
          {opportunity.remote && (
            <span className="text-[11px] font-medium text-ink/50">Remote</span>
          )}
          {!opportunity.remote && opportunity.location && (
            <span className="text-[11px] font-medium text-ink/50">
              {opportunity.location}
            </span>
          )}
        </div>
        <SaveButton
          opportunityId={opportunity.id}
          initialSaved={isSaved}
          isAuthed={isAuthed}
        />
      </div>
    </div>
  );
}
