import { Skeleton } from "@/components/skeleton/skeleton";

export default function PricesLoading() {
  return (
    <div className="px-5 pt-7">
      <Skeleton className="h-6 w-40" />
      <div className="mt-6 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-28" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-14 w-full rounded-card-sm" />
              <Skeleton className="h-14 w-full rounded-card-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
