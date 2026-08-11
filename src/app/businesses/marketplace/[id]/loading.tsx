import { Skeleton } from "@/components/skeleton/skeleton";

export default function ListingDetailLoading() {
  return (
    <div className="px-5 pt-7">
      <Skeleton className="h-9 w-9 rounded-full" />
      <Skeleton className="mt-4 h-48 w-full rounded-card" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-7 w-24 rounded-pill" />
      </div>
      <Skeleton className="mt-3 h-6 w-[80%]" />
      <Skeleton className="mt-2 h-5 w-24" />
      <Skeleton className="mt-4 h-28 w-full rounded-card" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3.5 w-40" />
      </div>
    </div>
  );
}
