import { Skeleton } from "./skeleton";

/**
 * Mirrors OpportunityCard's proportions: org mark, title, tags, footer row.
 */
export function SkeletonOpportunityCard() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-4 w-[85%]" />
        </div>
      </div>
      <Skeleton className="mt-3 h-3.5 w-full" />
      <Skeleton className="mt-1.5 h-3.5 w-[70%]" />
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-14 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Simple flat list row: avatar/icon circle + two text lines.
 * Fits Team Finder, Business Directory, Tools list items.
 */
export function SkeletonListRow() {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
      <Skeleton className="size-11 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-[65%]" />
        <Skeleton className="mt-2 h-3 w-[85%]" />
      </div>
    </div>
  );
}

/** Compact tile for grid layouts (Growth Hub cards, Skills, etc.) */
export function SkeletonTile() {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
      <Skeleton className="size-8 rounded-md" />
      <Skeleton className="mt-3 h-3.5 w-[70%]" />
      <Skeleton className="mt-1.5 h-3 w-[50%]" />
    </div>
  );
}

/** Full-width header block for single detail records loading */
export function SkeletonDetailHeader() {
  return (
    <div>
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-6 w-[80%]" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3.5 w-full" />
      <Skeleton className="mt-1.5 h-3.5 w-[90%]" />
      <Skeleton className="mt-1.5 h-3.5 w-[60%]" />
    </div>
  );
}
