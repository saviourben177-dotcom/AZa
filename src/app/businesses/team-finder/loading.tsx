import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonListRow } from "@/components/skeleton/skeleton-card";

export default function TeamFinderLoading() {
  return (
    <div className="px-5 pt-7">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-9 w-20 rounded-pill" />
      </div>
      <Skeleton className="mt-2 h-3.5 w-56" />

      <Skeleton className="mt-6 h-12 w-full rounded-pill" />

      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 w-14 rounded-pill" />
        <Skeleton className="h-9 w-24 rounded-pill" />
        <Skeleton className="h-9 w-22 rounded-pill" />
        <Skeleton className="h-9 w-26 rounded-pill" />
      </div>

      <div className="mt-5 space-y-3">
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
      </div>
    </div>
  );
}
