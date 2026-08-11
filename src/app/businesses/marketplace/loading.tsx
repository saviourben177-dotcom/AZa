import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonListRow } from "@/components/skeleton/skeleton-card";

export default function MarketplaceLoading() {
  return (
    <div className="px-5 pt-7">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-16 rounded-pill" />
        <Skeleton className="h-8 w-20 rounded-pill" />
        <Skeleton className="h-8 w-14 rounded-pill" />
      </div>
      <div className="mt-4 space-y-3">
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
      </div>
    </div>
  );
}
