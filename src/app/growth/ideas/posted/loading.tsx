import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonListRow } from "@/components/skeleton/skeleton-card";

export default function PostedIdeasLoading() {
  return (
    <div className="px-5 pt-7">
      <Skeleton className="h-6 w-40" />
      <div className="mt-4 space-y-3">
        <SkeletonListRow />
        <SkeletonListRow />
      </div>
    </div>
  );
}
