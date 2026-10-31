"use client";

import Link from "next/link";
import { Bookmark, X } from "lucide-react";
import { btn } from "@/components/aza/kit";
import { Deadline, Tag } from "@/components/aza/ui";
import type { Opportunity } from "@/lib/aza-data";
import { cn } from "@/lib/utils";

/**
 * Webnovel-style exit-intent: "are you sure you want to leave? here's
 * something similar, but better" — shown once, only when the user tries to
 * leave an opportunity they haven't saved, and only when there's something
 * real to show them instead (similar.length > 0, checked by the caller).
 */
export default function OpportunityExitIntent({
  similar,
  onStay,
  onLeave,
}: {
  similar: Opportunity[];
  onStay: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm md:items-center md:p-4"
      onClick={onStay}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-border bg-card p-5 shadow-[var(--shadow-lift)] md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 id="exit-intent-title" className="text-lg font-display font-bold text-foreground">
            Leaving already?
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onStay}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          You haven&apos;t saved this one yet. A few similar opportunities you might not want to miss:
        </p>

        <div className="mt-4 space-y-2">
          {similar.map((s) => (
            <Link
              key={s.id}
              href={`/opportunities/${s.id}`}
              onClick={onStay}
              className="card-lift flex items-center gap-3 rounded-lg border bg-background p-3 hover:border-primary/40"
            >
              <span className="emboss grid size-10 shrink-0 place-items-center rounded-md border font-display text-sm font-bold">
                {s.orgMark}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{s.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {s.amount && <Tag tone="primary">{s.amount}</Tag>}
                  <Deadline days={s.daysLeft} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onStay} className={cn(btn.primary, "flex-1 justify-center")}>
            <Bookmark className="size-4" /> Stay and save it
          </button>
          <button type="button" onClick={onLeave} className={cn(btn.secondary, "flex-1 justify-center")}>
            Leave anyway
          </button>
        </div>
      </div>
    </div>
  );
}
