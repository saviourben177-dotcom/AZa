import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonListRow } from "@/components/skeleton/skeleton-card";

export default function CuratorLoading() {
  return (
    <div>
      <Skeleton className="h-12 w-full rounded-card" />
      <div className="mt-4 space-y-2.5">
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
      </div>
    </div>
  );
}
