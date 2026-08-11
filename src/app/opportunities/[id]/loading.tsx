import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonDetailHeader } from "@/components/skeleton/skeleton-card";

export default function OpportunityDetailLoading() {
  return (
    <div className="px-5 pt-7">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="mt-4">
        <SkeletonDetailHeader />
      </div>
      <Skeleton className="mt-6 h-12 w-full rounded-pill" />
    </div>
  );
}
