import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { OPPORTUNITY_CATEGORY_LABELS } from "@/lib/types";
import { AppShell } from "@/components/aza/app-shell";
import { btn, Empty, Stat } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";
import { ReportsQueue } from "@/components/aza/reports-queue";
import DeleteOpportunityButton from "@/components/curator/delete-opportunity-button";

export const dynamic = "force-dynamic";

export default async function CuratorPage() {
  const supabase = await createClient();
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .order("deadline", { ascending: true, nullsFirst: false });

  const list = opportunities ?? [];
  const verifiedCount = list.filter((o) => o.curator_verified).length;

  return (
    <AppShell>
      <PageHeader
        title="Curator"
        sub="Manage posted opportunities."
        action={
          <Link href="/curator/opportunities/new" className={btn.primary}>
            Add opportunity
          </Link>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3">
        <Stat label="Opportunities" value={list.length} />
        <Stat label="Verified" value={verifiedCount} />
      </div>

      {list.length === 0 ? (
        <Empty title="No opportunities yet" />
      ) : (
        <ul className="grid gap-3">
          {list.map((opp) => (
            <li
              key={opp.id}
              className="grid gap-3 rounded-lg border bg-card p-4 shadow-[var(--shadow-card)] sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <Tag tone="info">
                  {OPPORTUNITY_CATEGORY_LABELS[opp.category as keyof typeof OPPORTUNITY_CATEGORY_LABELS]}
                </Tag>
                <p className="mt-1.5 font-bold">{opp.title}</p>
                <p className="text-sm text-muted-foreground">
                  {opp.curator_verified ? "Verified" : "Unverified"}
                  {opp.deadline
                    ? ` · Due ${new Date(opp.deadline).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`
                    : ""}
                </p>
              </div>
              <div className="flex gap-3">
                <Link href={`/curator/opportunities/${opp.id}/edit`} className={btn.secondary}>
                  Edit
                </Link>
                <DeleteOpportunityButton id={opp.id} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <ReportsQueue />
      </div>
    </AppShell>
  );
}
