import Link from "next/link";
import type { Opportunity } from "@/lib/types";
import { daysUntil } from "@/lib/types";
import CategoryIconTile from "@/components/category-icon-tile";
import VerifiedBadge from "@/components/verified-badge";
import SaveButton from "@/components/save-button";

/**
 * Compact horizontal list card — spec §9.1 "Opportunity Card (list)".
 * Used on Home (Recommended for you, Upcoming deadlines) and Saved.
 * Leading 44x44 tile + title/meta stack + trailing bookmark.
 */
export default function OpportunityCard({
  opportunity,
  isSaved,
  isAuthed,
}: {
  opportunity: Opportunity;
  isSaved: boolean;
  isAuthed: boolean;
}) {
  const days = daysUntil(opportunity.deadline);

  return (
    <Link
      href={`/opportunities/${opportunity.id}`}
      className="flex items-center gap-3 rounded-card bg-surface p-4 shadow-card"
    >
      <CategoryIconTile category={opportunity.category} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[12px] font-semibold text-text-secondary">
            {opportunity.org}
          </p>
          {opportunity.curator_verified && <VerifiedBadge compact />}
        </div>
        <h3 className="mt-0.5 truncate text-[15px] font-semibold leading-tight text-ink">
          {opportunity.title}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          {days !== null && days >= 0 && (
            <span className="rounded-pill bg-gold-light px-2 py-0.5 text-[11px] font-bold text-gold">
              {days === 0 ? "Due today" : `${days}d left`}
            </span>
          )}
          <span className="truncate text-[11.5px] font-medium text-text-tertiary">
            {opportunity.remote ? "Remote" : opportunity.location ?? "Nigeria"}
          </span>
        </div>
      </div>

      <div onClick={(e) => e.preventDefault()} className="shrink-0">
        <SaveButton
          opportunityId={opportunity.id}
          initialSaved={isSaved}
          isAuthed={isAuthed}
        />
      </div>
    </Link>
  );
}
