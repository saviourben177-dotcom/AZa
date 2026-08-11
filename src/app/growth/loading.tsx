import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonTile } from "@/components/skeleton/skeleton-card";

export default function GrowthHubLoading() {
  return (
    <div className="px-5 pt-7">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-6 w-52" />

      <Skeleton className="mt-5 h-12 w-full rounded-card-sm" />

      <div className="mt-6 grid grid-cols-2 gap-3">
        <SkeletonTile />
        <SkeletonTile />
        <SkeletonTile />
        <SkeletonTile />
      </div>

      <div className="mt-7 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3.5 w-12" />
      </div>
      <div className="mt-4 space-y-3">
        <Skeleton className="h-20 w-full rounded-card" />
        <Skeleton className="h-20 w-full rounded-card" />
      </div>
    </div>
  );
}
