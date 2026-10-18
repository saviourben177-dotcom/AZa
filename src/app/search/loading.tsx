import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonListRow } from "@/components/skeleton/skeleton-card";
import { AppShell } from "@/components/aza/app-shell";

export default function SearchLoading() {
  return (
    <AppShell>
      <Skeleton className="h-12 w-full rounded-full" />

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
    </AppShell>
  );
}
