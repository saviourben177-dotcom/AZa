import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonListRow } from "@/components/skeleton/skeleton-card";
import { AppShell } from "@/components/aza/app-shell";

export default function SkillsLoading() {
  return (
    <AppShell>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="mt-4 space-y-3">
        <SkeletonListRow />
        <SkeletonListRow />
      </div>
    </AppShell>
  );
}
