import Image from "next/image";
import Link from "next/link";
import type { Opportunity } from "@/lib/types";
import DeadlinePill from "@/components/deadline-pill";
import VerifiedBadge from "@/components/verified-badge";
import SaveButton from "@/components/save-button";
import { CATEGORY_IMAGE, CATEGORY_EYEBROW } from "@/lib/category-visuals";

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
    <div className="overflow-hidden rounded-card border border-line-strong bg-surface shadow-card">
      <Link href={`/opportunities/${opportunity.id}`} className="block">
        <div className="relative h-36 w-full overflow-hidden">
          <Image
            src={CATEGORY_IMAGE[opportunity.category]}
            alt=""
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" />
          <div className="absolute left-3 top-3 right-3 flex items-start justify-between">
            <span className="rounded-pill bg-black/55 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              {CATEGORY_EYEBROW[opportunity.category]}
            </span>
            {opportunity.curator_verified && <VerifiedBadge />}
          </div>
          <div className="absolute -bottom-3 left-3">
            <DeadlinePill deadline={opportunity.deadline} />
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4 pt-6">
        <Link href={`/opportunities/${opportunity.id}`} className="block">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-aza" />
            <p className="text-[12px] font-semibold text-ink/55">{opportunity.org}</p>
          </div>
          <h3 className="font-display text-[17px] font-bold leading-snug text-ink">
            {opportunity.title}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink/65">
          {opportunity.description}
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <span className="text-[11.5px] font-medium text-ink/50">
            {opportunity.remote ? "🌍 Remote" : opportunity.location ?? "Nigeria"}
          </span>
          <SaveButton
            opportunityId={opportunity.id}
            initialSaved={isSaved}
            isAuthed={isAuthed}
          />
        </div>
      </div>
    </div>
  );
}
