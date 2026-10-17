"use client";

import { Flag } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, type ReportType } from "@/lib/aza/api";
import { cn } from "@/lib/utils";
import { btn } from "./kit";

export const reportReasons = [
  { value: "spam", label: "Spam or scam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate speech" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "misinformation", label: "False or misleading" },
  { value: "other", label: "Something else" },
] as const;

export type ReportTarget = { type: ReportType; id: string; userId: string; content: string };

export function ReportDialog({ target, open, onOpenChange }: { target: ReportTarget; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!reason) return;
    setBusy(true);
    await api.createReport({ report_type: target.type, target_id: target.id, reported_user_id: target.userId, content: target.content, reason, notes: notes.trim() || null });
    setBusy(false);
    setReason(""); setNotes("");
    onOpenChange(false);
    toast.success("Report sent. Our moderators will review it.");
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report {target.type}</DialogTitle>
          <DialogDescription>Why are you reporting this? The person won't know it was you.</DialogDescription>
        </DialogHeader>
        <p className="line-clamp-3 rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">"{target.content}"</p>
        <div role="radiogroup" aria-label="Reason" className="grid gap-1.5">
          {reportReasons.map((r) => (
            <button key={r.value} type="button" role="radio" aria-checked={reason === r.value} onClick={() => setReason(r.value)}
              className={cn("flex h-11 items-center justify-between rounded-md border px-3 text-left text-sm font-medium",
                reason === r.value ? "border-primary bg-primary-soft text-primary-strong" : "hover:bg-accent")}>
              {r.label}
              <span className={cn("size-4 rounded-full border-2", reason === r.value ? "border-primary bg-primary" : "border-border-strong")} />
            </button>
          ))}
        </div>
        {reason === "other" || reason ? (
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Add details (optional)" aria-label="Details"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        ) : null}
        <div className="flex justify-end gap-2">
          <button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button>
          <button type="button" className={btn.primary} disabled={!reason || busy} onClick={submit}>{busy ? "Sending…" : "Send report"}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Small flag button for posts and chat messages. */
export function ReportButton({ target, className, label }: { target: ReportTarget; className?: string; label?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" aria-label={`Report ${target.type}`} onClick={() => setOpen(true)}
        className={cn("inline-flex items-center justify-center gap-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-destructive", className)}>
        <Flag className="size-4" />{label && <span className="text-sm font-medium">Report</span>}
      </button>
      <ReportDialog target={target} open={open} onOpenChange={setOpen} />
    </>
  );
}

/** Hold for 2 seconds to reveal a Report action (used on comments). */
export function LongPressReport({ target, children }: { target: ReportTarget; children: ReactNode }) {
  const [pressing, setPressing] = useState(false);
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const start = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setPressing(true);
    timer.current = setTimeout(() => { setPressing(false); setMenu(true); navigator.vibrate?.(30); }, 2000);
  };
  const cancel = () => { clearTimeout(timer.current); setPressing(false); };
  return (
    <div className="relative select-none" onPointerDown={start} onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}>
      <div className={cn("rounded-md transition-colors", pressing && "bg-accent", menu && "bg-accent")}>{children}</div>
      {pressing && <div className="absolute bottom-0 left-0 h-0.5 animate-[grow_2s_linear_forwards] rounded bg-primary" style={{ width: 0 }} />}
      {menu && (
        <div className="absolute right-0 top-full z-30 mt-1 flex gap-1 rounded-md border bg-popover p-1 shadow-[var(--shadow-lift)]">
          <button type="button" className="inline-flex h-10 items-center gap-1.5 rounded px-3 text-sm font-medium text-destructive hover:bg-accent" onClick={() => { setMenu(false); setOpen(true); }}>
            <Flag className="size-4" /> Report
          </button>
          <button type="button" className="h-10 rounded px-3 text-sm text-muted-foreground hover:bg-accent" onClick={() => setMenu(false)}>Cancel</button>
        </div>
      )}
      <ReportDialog target={target} open={open} onOpenChange={setOpen} />
    </div>
  );
}
