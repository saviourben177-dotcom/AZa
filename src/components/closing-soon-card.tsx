import Link from "next/link";
import type { Opportunity } from "@/lib/types";
import { daysUntil } from "@/lib/types";

export default function ClosingSoonCard({ opportunity }: { opportunity: Opportunity }) {
  const days = daysUntil(opportunity.deadline);

  return (
    <Link
      href={`/opportunities/${opportunity.id}`}
      className="block w-36 shrink-0 rounded-card border border-line bg-surface p-3"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-dim text-[13px] font-bold text-ink/50">
        {opportunity.org.charAt(0)}
      </div>
      <p className="mt-2 line-clamp-2 text-[12.5px] font-bold leading-snug text-ink">
        {opportunity.title}
      </p>
      {days !== null && days >= 0 && (
        <p className="mt-1 text-[11px] font-semibold text-danger">
          Closes in {days} day{days === 1 ? "" : "s"}
        </p>
      )}
    </Link>
  );
}
