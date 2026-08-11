import { Skeleton } from "@/components/skeleton/skeleton";

export default function DiscoverLoading() {
  return (
    <div className="px-5 pt-7">
      <Skeleton className="h-6 w-28" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-16 rounded-pill" />
        <Skeleton className="h-8 w-20 rounded-pill" />
        <Skeleton className="h-8 w-14 rounded-pill" />
        <Skeleton className="h-8 w-18 rounded-pill" />
      </div>

      <div className="mt-6 overflow-hidden rounded-card border border-line-strong bg-surface shadow-card">
        <Skeleton className="h-64 w-full rounded-none" />
        <div className="px-4 pb-5 pt-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-5 w-[85%]" />
          <Skeleton className="mt-2 h-5 w-[55%]" />
          <Skeleton className="mt-4 h-3.5 w-full" />
          <Skeleton className="mt-1.5 h-3.5 w-[70%]" />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-6">
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-14 w-14 rounded-full" />
      </div>
    </div>
  );
}
