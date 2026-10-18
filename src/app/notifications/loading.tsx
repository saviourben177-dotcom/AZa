import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonListRow } from "@/components/skeleton/skeleton-card";
import { AppShell } from "@/components/aza/app-shell";

export default function NotificationsLoading() {
  return (
    <AppShell>
      <Skeleton className="h-6 w-36" />
      <div className="mt-5 space-y-2.5">
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
      </div>
    </AppShell>
  );
}
