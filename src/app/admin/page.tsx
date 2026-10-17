import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/aza/app-shell";
import { PageHeader } from "@/components/aza/ui";
import { Stat } from "@/components/aza/kit";
import { ReportsQueue } from "@/components/aza/reports-queue";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ count: businessCount }, { count: ideaLibraryCount }, { count: teamCount }] =
    await Promise.all([
      supabase.from("businesses").select("*", { count: "exact", head: true }),
      supabase.from("idea_library").select("*", { count: "exact", head: true }),
      supabase
        .from("ideas")
        .select("*", { count: "exact", head: true })
        .eq("looking_for_collaborators", true),
    ]);

  const { data: recentLog } = await supabase
    .from("admin_content_log")
    .select("action, table_name, summary, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <AppShell>
      <PageHeader title="Admin" sub="Moderate content and manage the platform." />

      <div className="mb-8 grid grid-cols-3 gap-3">
        <Link href="/admin/businesses">
          <Stat label="Businesses" value={businessCount ?? 0} />
        </Link>
        <Link href="/admin/idea-library">
          <Stat label="Idea Library" value={ideaLibraryCount ?? 0} />
        </Link>
        <Link href="/admin/teams">
          <Stat label="Open Teams" value={teamCount ?? 0} />
        </Link>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Recent admin actions</h2>
        <div className="rounded-lg border bg-card">
          {recentLog && recentLog.length > 0 ? (
            <ul className="divide-y">
              {recentLog.map((entry, i) => (
                <li key={i} className="flex justify-between px-4 py-2 text-sm">
                  <span>{entry.summary}</span>
                  <span className="text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">No admin actions yet.</p>
          )}
        </div>
      </section>

      <div className="mt-8">
        <ReportsQueue />
      </div>
    </AppShell>
  );
}
