"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * screen-mapping doc notes "Recent searches" has no backing table — would
 * need local storage or a search_history table for persistence across
 * devices/sessions. This uses in-memory React state only (resets on reload),
 * which is honestly labeled rather than pretending to be a persistent
 * history the way localStorage would silently imply.
 */
export default function SearchInput({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [recent, setRecent] = useState<string[]>([]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = value.trim();
    if (!term) return;
    setRecent((r) => [term, ...r.filter((x) => x !== term)].slice(0, 6));
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Link href="/" aria-label="Back" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-dim text-ink/70">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <form onSubmit={submit} className="relative flex-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="absolute left-4 top-1/2 -translate-y-1/2">
            <circle cx="11" cy="11" r="7" stroke="rgb(var(--text-secondary))" strokeWidth="1.8" />
            <path d="M20 20l-3.5-3.5" stroke="rgb(var(--text-secondary))" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search anything on Aza..."
            className="h-11 w-full rounded-pill bg-paper-dim pl-11 pr-4 text-[14px] text-ink placeholder:text-text-tertiary focus:outline-none"
          />
        </form>
      </div>

      {recent.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-tertiary">Recent searches</h2>
            <button onClick={() => setRecent([])} className="text-[11.5px] font-semibold text-aza">Clear all</button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {recent.map((term) => (
              <button
                key={term}
                onClick={() => {
                  setValue(term);
                  router.push(`/search?q=${encodeURIComponent(term)}`);
                }}
                className="rounded-pill bg-paper-dim px-3.5 py-2 text-[12.5px] font-semibold text-text-secondary"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
