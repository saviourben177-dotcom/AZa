import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonListRow } from "@/components/skeleton/skeleton-card";
import { AppShell } from "@/components/aza/app-shell";

export default function CuratorLoading() {
  return (
    <AppShell>
      <Skeleton className="h-12 w-full rounded-lg" />
      <div className="mt-4 space-y-2.5">
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
      </div>
    </AppShell>
  );
}
