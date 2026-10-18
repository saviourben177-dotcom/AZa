import { Skeleton } from "@/components/skeleton/skeleton";
import { AppShell } from "@/components/aza/app-shell";

export default function BusinessDetailLoading() {
  return (
    <AppShell>
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="mt-4 flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-md" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-3 w-32" />
          <Skeleton className="mt-2 h-3.5 w-28" />
        </div>
      </div>
      <Skeleton className="mt-4 h-24 w-full rounded-lg" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-7 h-40 w-full rounded-lg" />
    </AppShell>
  );
}
