import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonListRow } from "@/components/skeleton/skeleton-card";
import { AppShell } from "@/components/aza/app-shell";

export default function DirectoryLoading() {
  return (
    <AppShell>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-40" />
      </div>

      <Skeleton className="mt-6 h-12 w-full rounded-full" />

      <div className="mt-5 space-y-3">
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
      </div>
    </AppShell>
  );
}
