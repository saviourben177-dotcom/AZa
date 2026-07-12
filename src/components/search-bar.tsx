"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function SearchBar({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="relative">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        className="absolute left-4 top-1/2 -translate-y-1/2"
      >
        <circle cx="11" cy="11" r="7" stroke="rgb(var(--text-secondary))" strokeWidth="1.8" />
        <path
          d="M20 20l-3.5-3.5"
          stroke="rgb(var(--text-secondary))"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-pill bg-paper-dim pl-11 pr-4 text-[14px] text-ink placeholder:text-text-tertiary focus:outline-none focus-visible:outline-2 focus-visible:outline-aza"
      />
    </form>
  );
}
