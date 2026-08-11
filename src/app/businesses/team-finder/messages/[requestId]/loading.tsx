import { Skeleton } from "@/components/skeleton/skeleton";

export default function MessageThreadLoading() {
  return (
    <div className="flex h-dvh flex-col">
      <div className="flex items-center gap-3 border-b border-line px-5 pb-4 pt-7">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="flex-1 space-y-3 overflow-hidden px-5 py-4">
        <div className="flex justify-start">
          <Skeleton className="h-10 w-[60%] rounded-card-sm" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-[45%] rounded-card-sm" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-14 w-[70%] rounded-card-sm" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-8 w-[35%] rounded-card-sm" />
        </div>
      </div>

      <div className="border-t border-line px-5 py-4">
        <Skeleton className="h-12 w-full rounded-pill" />
      </div>
    </div>
  );
}
