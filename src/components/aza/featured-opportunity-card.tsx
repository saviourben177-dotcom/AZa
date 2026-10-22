"use client";

import { ExternalLink } from "lucide-react";
import type { FeaturedOpportunity } from "@/lib/aza/featured-opportunities";
import { logFeaturedOpportunityClick } from "@/lib/actions/featured-opportunities";
import FeaturedStatusControl from "./featured-status-control";
import type { ApplicationStatus } from "@/lib/types";

export default function FeaturedOpportunityCard({
  featured,
  status,
  signedIn,
}: {
  featured: FeaturedOpportunity;
  status: ApplicationStatus;
  signedIn: boolean;
}) {
  function handleOpen() {
    // Fire-and-forget: logging must never block or delay the external
    // link opening (target="_blank" below handles the actual navigation,
    // so this just records the click alongside it).
    void logFeaturedOpportunityClick(featured.id);
  }

  return (
    <div className="card-lift relative flex flex-col gap-3 overflow-hidden rounded-lg border bg-card p-4 pt-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="emboss grid size-10 shrink-0 place-items-center rounded-md border font-display text-sm font-bold">
          {featured.mark}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-primary-strong">{featured.categoryTag}</p>
          <h3 className="text-base leading-snug">{featured.title}</h3>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{featured.description}</p>
      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
        {signedIn ? (
          <FeaturedStatusControl featuredId={featured.id} currentStatus={status} />
        ) : (
          <span className="text-xs text-muted-foreground">Sign in to track status</span>
        )}
        <a
          href={featured.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOpen}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          {featured.linkType === "referral" ? "Join" : "Apply"}
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}
