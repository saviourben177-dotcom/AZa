"use client";

import { useState } from "react";
import DefaultAvatar from "@/components/default-avatar";

/**
 * Renders a profile photo and recovers if the URL fails to load (deleted
 * storage object, expired signed URL, network hiccup) by falling back to
 * the person's initial, or the default silhouette icon if no name is known.
 */
export default function AvatarImg({
  src,
  alt,
  size,
  fallbackInitial,
}: {
  src: string;
  alt: string;
  size: number;
  fallbackInitial?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    if (fallbackInitial) {
      return (
        <span
          aria-hidden
          style={{ width: size, height: size }}
          className="grid shrink-0 place-items-center rounded-full emboss-primary font-display text-sm font-bold"
        >
          {fallbackInitial}
        </span>
      );
    }
    return <DefaultAvatar className="shrink-0" style={{ width: size, height: size }} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
