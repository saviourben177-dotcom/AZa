import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonListRow } from "@/components/skeleton/skeleton-card";

export default function DirectoryLoading() {
  return (
    <div className="px-5 pt-7">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-40" />
      </div>

      <Skeleton className="mt-6 h-12 w-full rounded-pill" />

      <div className="mt-5 space-y-3">
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
      </div>
    </div>
  );
}
