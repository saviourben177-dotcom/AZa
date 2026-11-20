import { Skeleton } from "@/components/skeleton/skeleton";
import { AppShell } from "@/components/aza/app-shell";

export default function PrepLoading() {
  return (
    <AppShell>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="mt-4 space-y-2.5">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </AppShell>
  );
}
