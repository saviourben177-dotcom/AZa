import { createClient } from "@/lib/supabase/server";
import ReportStatusButtons from "@/components/curator/report-status-buttons";

export const dynamic = "force-dynamic";

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

export default async function CuratorReportsPage() {
  const supabase = await createClient();
  const { data } = await (supabase as unknown as { from: (table: "reports") => { select: (query: string) => { order: (column: string, options: { ascending: boolean }) => Promise<{ data: ReportRow[] | null }> } } })
    .from("reports")
    .select("id, content_type, content_preview, reason, details, status, created_at, reporter:profiles!reports_reporter_id_fkey(full_name), reported_user:profiles!reports_reported_user_id_fkey(full_name)")
    .order("created_at", { ascending: false });
  const reports = data ?? [];

  return (
    <div>
      <h2 className="font-display text-[16px] font-bold text-ink">Reports</h2>
      <p className="mt-1 text-[12.5px] text-ink/50">Reports submitted by the Aza community.</p>
      <div className="mt-4 space-y-3">
        {reports.map((report) => (
          <article key={report.id} className="rounded-card border border-line bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45">{report.content_type.replace("_", " ")}</p>
                <p className="mt-1 text-[13.5px] font-bold text-ink">{report.reason}</p>
              </div>
              <span className={`rounded-pill px-2.5 py-1 text-[10.5px] font-bold ${report.status === "open" ? "bg-danger/10 text-danger" : "bg-paper text-ink/50"}`}>{report.status}</span>
            </div>
            <blockquote className="mt-3 whitespace-pre-line border-l-2 border-aza/30 pl-3 text-[12.5px] leading-relaxed text-ink/65">{report.content_preview}</blockquote>
            {report.details && <p className="mt-3 text-[12px] text-ink/55">Reporter note: {report.details}</p>}
            <p className="mt-3 text-[11px] text-ink/45">Reported by {report.reporter?.full_name ?? "Aza user"} · Content by {report.reported_user?.full_name ?? "Aza user"} · {new Date(report.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p>
            {report.status === "open" && <div className="mt-3"><ReportStatusButtons reportId={report.id} /></div>}
          </article>
        ))}
        {reports.length === 0 && <p className="rounded-card border border-dashed border-line-strong p-4 text-[13px] text-ink/50">No reports yet.</p>}
      </div>
    </div>
  );
}
