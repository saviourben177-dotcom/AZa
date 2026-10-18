import { Skeleton } from "@/components/skeleton/skeleton";
import { AppShell } from "@/components/aza/app-shell";

export default function CvBuilderLoading() {
  return (
    <AppShell>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-1.5 h-3 w-44" />
        </div>
      </div>

      <div className="mt-7 space-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-[70%]" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-6 h-12 w-full rounded-full" />
    </AppShell>
  );
}
