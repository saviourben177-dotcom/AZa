import { Skeleton } from "./skeleton";

/**
 * Mirrors OpportunityCard's proportions: image banner, org line,
 * title, description, footer row.
 */
export function SkeletonOpportunityCard() {
  return (
    <div className="overflow-hidden rounded-card border border-line-strong bg-surface shadow-card">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="px-4 pb-4 pt-6">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Skeleton className="h-1.5 w-1.5 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-4.5 w-[85%]" />
        <Skeleton className="mt-2 h-4.5 w-[60%]" />
        <Skeleton className="mt-3 h-3.5 w-full" />
        <Skeleton className="mt-1.5 h-3.5 w-[70%]" />
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
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
    <div className="flex items-center gap-3 rounded-card border border-line-strong bg-surface p-4 shadow-card">
      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
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
    <div className="rounded-card-sm border border-line-strong bg-surface p-4 shadow-card">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="mt-3 h-3.5 w-[70%]" />
      <Skeleton className="mt-1.5 h-3 w-[50%]" />
    </div>
  );
}

/** Full-width empty-state-shaped block for single detail records loading */
export function SkeletonDetailHeader() {
  return (
    <div>
      <Skeleton className="h-44 w-full rounded-card" />
      <Skeleton className="mt-4 h-3 w-28" />
      <Skeleton className="mt-2 h-6 w-[80%]" />
      <Skeleton className="mt-3 h-3.5 w-full" />
      <Skeleton className="mt-1.5 h-3.5 w-[90%]" />
      <Skeleton className="mt-1.5 h-3.5 w-[60%]" />
    </div>
  );
}
