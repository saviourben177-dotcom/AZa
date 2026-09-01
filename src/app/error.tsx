"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the console (and, if you wire one up later, an error
    // reporting service) without ever showing this raw detail to users.
    console.error("Aza route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-light text-2xl">
        ⚠️
      </div>
      <h1 className="mt-5 font-display text-[19px] font-bold text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed text-ink/55">
        We hit a snag loading this page. It&apos;s not you — try again in a
        moment.
      </p>

      <div className="mt-6 flex w-full max-w-xs flex-col gap-2.5">
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-pill bg-aza py-3.5 text-[14.5px] font-bold text-white shadow-glow-accent"
        >
          Try again
        </button>
        <Link
          href="/"
          className="w-full rounded-pill border border-line-strong bg-surface py-3.5 text-center text-[14.5px] font-bold text-ink shadow-card"
        >
          Go home
        </Link>
      </div>

      {error.digest && (
        <p className="mt-5 text-[11px] text-ink/35">Ref: {error.digest}</p>
      )}
    </div>
  );
}
