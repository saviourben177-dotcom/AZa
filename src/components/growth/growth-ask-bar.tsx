"use client";

import { useState } from "react";

/**
 * Screen-mapping doc flags this explicitly: "Ask me anything" chat input has
 * no backend endpoint. Rather than fake a response or silently swallow the
 * submit, this tells the person plainly that it's not wired up yet — an
 * honest disabled state, not a dead-looking or deceptive one.
 */
export default function GrowthAskBar() {
  const [value, setValue] = useState("");
  const [showNotice, setShowNotice] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setShowNotice(true);
    setTimeout(() => setShowNotice(false), 3000);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-pill bg-surface px-4 py-1 shadow-card">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask or search anything..."
          className="h-11 flex-1 bg-transparent text-[13.5px] text-ink placeholder:text-text-tertiary focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Send"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aza text-white"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
      {showNotice && (
        <p className="mt-2 text-[11.5px] font-medium text-text-secondary">
          Growth AI isn&apos;t connected yet — try My Skills, Ideas, or Courses below for now.
        </p>
      )}
    </div>
  );
}
