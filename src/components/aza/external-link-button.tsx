"use client";

import type { ReactNode } from "react";
import { openExternalUrl } from "@/lib/open-external-url";

/**
 * Drop-in replacement for `<a href={url} target="_blank">` that also works
 * inside the Capacitor native app shell (see open-external-url.ts for why
 * plain target="_blank" doesn't work there).
 *
 * Usable from server components since it's just a thin client boundary.
 */
export default function ExternalLinkButton({
  url,
  className,
  children,
}: {
  url: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={() => openExternalUrl(url)} className={className}>
      {children}
    </button>
  );
}
