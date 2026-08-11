import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonListRow } from "@/components/skeleton/skeleton-card";

export default function SkillsLoading() {
  return (
    <div className="px-5 pt-7">
      <Skeleton className="h-6 w-28" />
      <div className="mt-4 space-y-3">
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
      </div>
    </div>
  );
}
