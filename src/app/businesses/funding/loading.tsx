import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonOpportunityCard } from "@/components/skeleton/skeleton-card";

export default function FundingLoading() {
  return (
    <div className="px-5 pt-7">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-44" />
      </div>
      <div className="mt-5 space-y-4">
        <SkeletonOpportunityCard />
        <SkeletonOpportunityCard />
      </div>
    </div>
  );
}
