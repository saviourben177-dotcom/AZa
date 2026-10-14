"use client";

import { BadgeCheck, Bookmark, ExternalLink, Sparkles, Users } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn } from "@/components/aza/kit";
import { Deadline, Tag } from "@/components/aza/ui";
import { ReportButton } from "@/components/aza/report";
import type { Opportunity } from "@/lib/aza-data";
import { api } from "@/lib/aza/api";
import { cn } from "@/lib/utils";

const statuses = ["Not started", "In progress", "Submitted", "Accepted", "Rejected"];

export default function OpportunityDetailClient({
  o,
  d,
  initialSaved = false,
}: {
  o: Opportunity;
  d: {
    description: string;
    eligibility: string;
    applyUrl: string;
    applicants: number;
  };
  initialSaved?: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [status, setStatus] = useState(statuses[0]);
  const [isPending, startTransition] = useTransition();

  const handleToggleSave = () => {
    startTransition(async () => {
      try {
        await api.saveOpportunity(o.id, !saved);
        setSaved(!saved);
        toast.success(!saved ? "Saved" : "Removed from saved");
      } catch {
        toast.error("Could not update saved status");
      }
    });
  };

  const handleTailorCv = async () => {
    try {
      const r = await api.tailorCv(o.id);
      toast.success(r.summary);
    } catch {
      toast.error("Could not generate tailored CV");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await api.setApplicationStatus(o.id, newStatus);
      toast.success("Status updated");
    } catch {
      toast.error("Could not update status");
    }
  };

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <BackLink to="/discover" label="Discover" />
        <ReportButton target={{ type: "idea", id: o.id, userId: "system", content: o.title }} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <article>
          <div className="mb-4 flex items-center gap-3">
            <span className="emboss grid size-14 place-items-center rounded-lg border font-display text-lg font-bold">
              {o.orgMark}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary-strong">
                {o.category}
              </p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                {o.org}
                {o.verified && (
                  <BadgeCheck aria-label="Verified" className="size-4 text-primary" />
                )}
              </p>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-foreground">
            {o.title}
          </h1>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Tag>{o.location}</Tag>
            {o.amount && <Tag tone="primary">{o.amount}</Tag>}
            <Deadline days={o.daysLeft} />
            <Tag icon={<Users className="size-3.5" />}>{d.applicants} applied</Tag>
          </div>

          <h2 className="mb-2 mt-8 text-lg font-display font-bold">About</h2>
          <p className="leading-relaxed text-foreground/85">{d.description}</p>

          <h2 className="mb-2 mt-6 text-lg font-display font-bold">Who can apply</h2>
          <p className="leading-relaxed text-foreground/85">{d.eligibility}</p>
        </article>

        <aside className="h-fit space-y-3 rounded-lg border bg-card p-5 shadow-[var(--shadow-lift)] lg:sticky lg:top-24">
          <a
            href={d.applyUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(btn.primary, "w-full justify-center")}
          >
            Apply now <ExternalLink className="size-4" />
          </a>

          <button
            className={cn(btn.secondary, "w-full justify-center")}
            aria-pressed={saved}
            disabled={isPending}
            onClick={handleToggleSave}
          >
            <Bookmark className="size-4" fill={saved ? "currentColor" : "none"} />
            {saved ? "Saved" : "Save"}
          </button>

          <button
            className={cn(btn.secondary, "w-full justify-center")}
            onClick={handleTailorCv}
          >
            <Sparkles className="size-4 text-primary" /> Tailor my CV
          </button>

          <label className="block pt-2 text-sm">
            <span className="font-semibold text-foreground">Application status</span>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </aside>
      </div>
    </AppShell>
  );
}
