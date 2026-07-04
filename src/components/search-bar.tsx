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
        className="absolute left-3.5 top-1/2 -translate-y-1/2"
      >
        <circle cx="11" cy="11" r="7" stroke="rgb(var(--ink) / 0.4)" strokeWidth="1.8" />
        <path
          d="M20 20l-3.5-3.5"
          stroke="rgb(var(--ink) / 0.4)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-pill border border-line-strong bg-surface py-3.5 pl-11 pr-4 text-[14px] text-ink shadow-card placeholder:text-ink/40"
      />
    </form>
  );
}
