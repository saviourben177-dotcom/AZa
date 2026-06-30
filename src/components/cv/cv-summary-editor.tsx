"use client";

import { useState, useTransition } from "react";
import { updateCvSummary } from "@/lib/actions/cv-profile";

export default function CvSummaryEditor({ initialSummary }: { initialSummary: string | null }) {
  const [value, setValue] = useState(initialSummary ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateCvSummary(value);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="mt-2.5">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="A couple of sentences about who you are and what you're looking for..."
        className="w-full rounded-card border border-line bg-surface px-4 py-3 text-[14px]"
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className="mt-2 rounded-card bg-paper-dim px-4 py-2 text-[12.5px] font-bold text-ink/70 disabled:opacity-60"
      >
        {isPending ? "Saving..." : saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}
