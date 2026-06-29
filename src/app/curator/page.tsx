import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { OPPORTUNITY_CATEGORY_LABELS } from "@/lib/types";
import DeleteOpportunityButton from "@/components/curator/delete-opportunity-button";

export const dynamic = "force-dynamic";

export default async function CuratorOpportunitiesPage() {
  const supabase = await createClient();
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .order("deadline", { ascending: true, nullsFirst: false });

  return (
    <div>
      <Link
        href="/curator/opportunities/new"
        className="block rounded-card bg-aza py-3 text-center text-[14px] font-bold text-white"
      >
        + Add opportunity
      </Link>

      <div className="mt-4 space-y-2.5">
        {(opportunities ?? []).length === 0 && (
          <p className="text-[13px] text-ink/50">No opportunities yet.</p>
        )}

        {opportunities?.map((opp) => (
          <div
            key={opp.id}
            className="rounded-card border border-line bg-surface p-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-ink">
                  {opp.title}
                </p>
                <p className="text-[12px] text-ink/50">
                  {OPPORTUNITY_CATEGORY_LABELS[opp.category as keyof typeof OPPORTUNITY_CATEGORY_LABELS]}
                  {opp.curator_verified ? " · Verified" : " · Unverified"}
                  {opp.deadline
                    ? ` · Due ${new Date(opp.deadline).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`
                    : ""}
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex gap-3">
              <Link
                href={`/curator/opportunities/${opp.id}/edit`}
                className="text-[12.5px] font-semibold text-aza"
              >
                Edit
              </Link>
              <DeleteOpportunityButton id={opp.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
