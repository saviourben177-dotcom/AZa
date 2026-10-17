"use client";

import { useState, useTransition } from "react";
import { setAccountPublic } from "@/lib/actions/privacy";

export default function PrivacySection({ initialIsPublic }: { initialIsPublic: boolean }) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function choose(next: boolean) {
    if (next === isPublic || isPending) return;
    const previous = isPublic;
    setIsPublic(next);
    setError(null);
    startTransition(async () => {
      try {
        await setAccountPublic(next);
      } catch (err) {
        setIsPublic(previous);
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    });
  }

  const options = [
    {
      value: true,
      title: "Public",
      description: "Other users can view your profile, follow you, and message you.",
    },
    {
      value: false,
      title: "Private",
      description: "Your profile is hidden from other users. They can't view it, follow you, or start a message.",
    },
  ];

  return (
    <div className="space-y-2.5">
      {options.map((opt) => {
        const selected = isPublic === opt.value;
        return (
          <button
            key={opt.title}
            type="button"
            onClick={() => choose(opt.value)}
            disabled={isPending}
            aria-pressed={selected}
            className={`flex w-full items-start gap-3 rounded-card border px-4 py-3.5 text-left transition-colors disabled:opacity-60 ${
              selected ? "border-aza bg-surface shadow-card" : "border-line bg-surface"
            }`}
          >
            <span
              className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                selected ? "border-aza" : "border-line-strong"
              }`}
            >
              {selected && <span className="h-2 w-2 rounded-full bg-aza" />}
            </span>
            <span>
              <span className="block text-[14px] font-semibold text-ink">{opt.title}</span>
              <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink/60">
                {opt.description}
              </span>
            </span>
          </button>
        );
      })}
      {error && <p className="text-[12.5px] font-medium text-danger">{error}</p>}
    </div>
  );
}
