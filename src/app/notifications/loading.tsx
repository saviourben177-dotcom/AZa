import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonListRow } from "@/components/skeleton/skeleton-card";

export default function NotificationsLoading() {
  return (
    <div className="px-5 pt-7">
      <Skeleton className="h-6 w-36" />
      <div className="mt-5 space-y-2.5">
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
      </div>
    </div>
  );
}
