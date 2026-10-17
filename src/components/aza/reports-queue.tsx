import { createClient } from "@/lib/supabase/server";
import { Empty, Section } from "./kit";
import { Tag } from "./ui";
import { ReportActionButtons } from "./report-action-buttons";

type ReportRow = {
  id: string;
  content_type: "message" | "idea" | "idea_comment";
  content_preview: string;
  reason: string;
  details: string | null;
  status: "open" | "reviewed" | "dismissed";
  created_at: string;
  reporter: { full_name: string | null } | null;
  reported_user: { full_name: string | null } | null;
};

export async function ReportsQueue() {
  const supabase = await createClient();
  const { data } = await (
    supabase as unknown as {
      from: (table: "reports") => {
        select: (query: string) => {
          eq: (col: string, val: string) => {
            order: (column: string, options: { ascending: boolean }) => Promise<{ data: ReportRow[] | null }>;
          };
        };
      };
    }
  )
    .from("reports")
    .select(
      "id, content_type, content_preview, reason, details, status, created_at, reporter:profiles!reports_reporter_id_fkey(full_name), reported_user:profiles!reports_reported_user_id_fkey(full_name)"
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const reports = data ?? [];

  return (
    <Section title={`Reports (${reports.length})`} className="mt-10">
      {reports.length === 0 ? (
        <Empty title="No open reports" />
      ) : (
        <ul className="grid gap-3">
          {reports.map((r) => (
            <li
              key={r.id}
              className="grid gap-3 rounded-lg border bg-card p-4 shadow-[var(--shadow-card)] sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap gap-1.5">
                  <Tag tone="urgent">{r.reason}</Tag>
                  <Tag>{r.content_type.replace("_", " ")}</Tag>
                </div>
                <p className="mt-2 font-medium">&quot;{r.content_preview}&quot;</p>
                {r.details && (
                  <p className="mt-1 text-sm text-muted-foreground">Reporter note: {r.details}</p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  {r.reported_user?.full_name ?? "Aza user"} reported by{" "}
                  {r.reporter?.full_name ?? "Aza user"} ·{" "}
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
              <ReportActionButtons reportId={r.id} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
