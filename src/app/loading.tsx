import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonOpportunityCard } from "@/components/skeleton/skeleton-card";
import { AppShell } from "@/components/aza/app-shell";

export default function HomeLoading() {
  return (
    <AppShell>
      <section className="mb-8 rounded-lg border border-primary/20 bg-primary-soft p-5 shadow-[var(--shadow-card)] md:p-6">
        <Skeleton className="h-3 w-20 bg-primary/20" />
        <Skeleton className="mt-2 h-7 w-[80%] bg-primary/20" />
        <Skeleton className="mt-2 h-3.5 w-[60%] bg-primary/20" />
      </section>

      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-14" />
      </div>
      <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonOpportunityCard />
        <SkeletonOpportunityCard />
        <SkeletonOpportunityCard />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-14" />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </AppShell>
  );
}
