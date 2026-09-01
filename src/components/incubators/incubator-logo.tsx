"use client";

import { useState } from "react";

export function IncubatorLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  const initials = name.slice(0, 2).toUpperCase();

  if (!logoUrl || failed) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aza-light text-[12px] font-bold text-aza">
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={`${name} logo`}
      width={32}
      height={32}
      className="h-8 w-8 shrink-0 rounded-full border border-line object-contain bg-white p-0.5"
      onError={() => setFailed(true)}
    />
  );
}
