import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonListRow } from "@/components/skeleton/skeleton-card";
import { AppShell } from "@/components/aza/app-shell";

export default function CoursesLoading() {
  return (
    <AppShell>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-14 rounded-full" />
      </div>
      <div className="mt-4 space-y-3">
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
      </div>
    </AppShell>
  );
}
