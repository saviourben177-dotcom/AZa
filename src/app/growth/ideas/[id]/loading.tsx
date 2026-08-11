import { Skeleton } from "@/components/skeleton/skeleton";

export default function IdeaDetailLoading() {
  return (
    <div className="px-5 pt-7">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="mt-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2 h-6 w-[85%]" />
        <Skeleton className="mt-4 h-3.5 w-full" />
        <Skeleton className="mt-1.5 h-3.5 w-full" />
        <Skeleton className="mt-1.5 h-3.5 w-[65%]" />
      </div>
      <Skeleton className="mt-6 h-12 w-full rounded-pill" />
    </div>
  );
}
