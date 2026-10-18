import { Skeleton } from "@/components/skeleton/skeleton";
import { AppShell } from "@/components/aza/app-shell";

export default function JoinRequestLoading() {
  return (
    <AppShell>
      <Skeleton className="h-9 w-9 rounded-full" />
      <Skeleton className="mt-4 h-3 w-24" />
      <Skeleton className="mt-2 h-6 w-[75%]" />
      <div className="mt-6 space-y-2.5">
        <Skeleton className="h-14 w-full rounded-md" />
        <Skeleton className="h-14 w-full rounded-md" />
      </div>
      <Skeleton className="mt-6 h-24 w-full rounded-md" />
      <Skeleton className="mt-4 h-12 w-full rounded-full" />
    </AppShell>
  );
}
