import { type HTMLAttributes } from "react";

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Base shimmer block. Compose with width/height utility classes.
 * e.g. <Skeleton className="h-4 w-32 rounded-full" />
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("animate-pulse rounded-md bg-muted", className)} {...props} />;
}
