import { Skeleton } from "@/components/skeleton/skeleton";

export default function ProfileLoading() {
  return (
    <div className="px-5 pt-7">
      <div className="flex items-center gap-4 rounded-card border border-line-strong bg-surface p-4 shadow-card">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-3 w-40" />
        </div>
        <Skeleton className="h-7 w-14 rounded-pill" />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-px overflow-hidden rounded-card border border-line-strong bg-line shadow-card">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface p-3">
            <Skeleton className="mx-auto h-4 w-6" />
            <Skeleton className="mx-auto mt-2 h-2.5 w-10" />
          </div>
        ))}
      </div>

      <div className="mt-7 space-y-2.5">
        <Skeleton className="h-12 w-full rounded-card-sm" />
        <Skeleton className="h-12 w-full rounded-card-sm" />
        <Skeleton className="h-12 w-full rounded-card-sm" />
      </div>
    </div>
  );
}
