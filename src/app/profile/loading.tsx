import { Skeleton } from "@/components/skeleton/skeleton";
import { SkeletonTile } from "@/components/skeleton/skeleton-card";
import { AppShell } from "@/components/aza/app-shell";

export default function ProfileLoading() {
  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-2 h-3.5 w-40" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="size-11 rounded-md" />
          <Skeleton className="size-11 rounded-md" />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 divide-x rounded-lg border bg-card text-center shadow-[var(--shadow-card)]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4">
            <Skeleton className="mx-auto h-7 w-8" />
            <Skeleton className="mx-auto mt-2 h-3 w-12" />
          </div>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <SkeletonTile />
        <SkeletonTile />
        <SkeletonTile />
        <SkeletonTile />
      </div>
    </AppShell>
  );
}
