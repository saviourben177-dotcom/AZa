import { Skeleton } from "@/components/skeleton/skeleton";
import { AppShell } from "@/components/aza/app-shell";

export default function PrepFieldLoading() {
  return (
    <AppShell>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-28" />
      </div>
      <Skeleton className="mt-5 h-1.5 w-full rounded-full" />
      <Skeleton className="mt-5 h-48 w-full rounded-lg" />
      <Skeleton className="mt-5 h-11 w-full rounded-md" />
    </AppShell>
  );
}
