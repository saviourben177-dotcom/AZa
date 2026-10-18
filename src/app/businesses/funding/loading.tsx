import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonOpportunityCard } from "@/components/skeleton/skeleton-card";
import { AppShell } from "@/components/aza/app-shell";

export default function FundingLoading() {
  return (
    <AppShell>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-44" />
      </div>
      <div className="mt-5 space-y-4">
        <SkeletonOpportunityCard />
        <SkeletonOpportunityCard />
      </div>
    </AppShell>
  );
}
