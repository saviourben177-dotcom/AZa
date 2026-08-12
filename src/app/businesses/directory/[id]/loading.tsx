import { Skeleton } from "@/components/skeleton/skeleton";

export default function BusinessDetailLoading() {
  return (
    <div className="px-5 pb-10 pt-7">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="mt-4 flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-card-sm" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-3 w-32" />
          <Skeleton className="mt-2 h-3.5 w-28" />
        </div>
      </div>
      <Skeleton className="mt-4 h-24 w-full rounded-card" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 w-24 rounded-pill" />
        <Skeleton className="h-9 w-20 rounded-pill" />
      </div>
      <Skeleton className="mt-7 h-40 w-full rounded-card" />
    </div>
  );
}
