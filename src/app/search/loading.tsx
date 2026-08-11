import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonListRow } from "@/components/skeleton/skeleton-card";

export default function SearchLoading() {
  return (
    <div className="px-4 pt-6">
      <Skeleton className="h-12 w-full rounded-pill" />

      <div className="mt-6 space-y-6">
        <div>
          <Skeleton className="h-3.5 w-28" />
          <div className="mt-3 space-y-2.5">
            <SkeletonListRow />
            <SkeletonListRow />
          </div>
        </div>
        <div>
          <Skeleton className="h-3.5 w-16" />
          <div className="mt-3 space-y-2.5">
            <SkeletonListRow />
          </div>
        </div>
      </div>
    </div>
  );
}
