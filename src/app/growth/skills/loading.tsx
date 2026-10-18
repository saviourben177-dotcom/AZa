import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonListRow } from "@/components/skeleton/skeleton-card";
import { AppShell } from "@/components/aza/app-shell";

export default function SkillsLoading() {
  return (
    <AppShell>
      <Skeleton className="h-6 w-28" />
      <div className="mt-4 space-y-3">
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
      </div>
    </AppShell>
  );
}
