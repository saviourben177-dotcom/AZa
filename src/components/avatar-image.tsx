"use client";

import { useState } from "react";
import DefaultAvatar from "@/components/default-avatar";

/**
 * Renders a user's avatar image, falling back to the themed default-person
 * icon if no URL is set OR if the URL fails to load (e.g. a stale/broken
 * Supabase storage path).
 */
export default function AvatarImage({
  src,
  className = "",
}: {
  src: string | null | undefined;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <DefaultAvatar className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={`${className} object-cover`}
      onError={() => setFailed(true)}
    />
  );
}
