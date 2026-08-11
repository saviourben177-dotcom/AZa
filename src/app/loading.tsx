import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonOpportunityCard } from "@/components/skeleton/skeleton-card";

export default function HomeLoading() {
  return (
    <div className="px-5 pt-7">
      <header className="flex items-start justify-between">
        <div>
          <Skeleton className="h-6 w-16" />
          <Skeleton className="mt-2 h-3.5 w-44" />
        </div>
        <Skeleton className="h-9 w-9 rounded-full" />
      </header>

      <Skeleton className="mt-5 h-12 w-full rounded-pill" />

      <div className="mt-7 flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3.5 w-12" />
      </div>

      <div className="mt-4 space-y-4">
        <SkeletonOpportunityCard />
        <SkeletonOpportunityCard />
        <SkeletonOpportunityCard />
      </div>
    </div>
  );
}
