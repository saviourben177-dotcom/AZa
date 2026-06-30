"use client";

import { useState, useTransition } from "react";
import { generateMyBaseCv } from "@/lib/actions/cv-generate";

export default function CvGenerateButton({ hasGenerated }: { hasGenerated: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        await generateMyBaseCv();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not generate CV");
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={isPending}
        className="w-full rounded-card bg-aza py-3.5 text-center text-[14.5px] font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Writing your CV..." : hasGenerated ? "Regenerate CV" : "Generate my CV"}
      </button>
      {error && <p className="mt-2 text-[12px] font-medium text-danger">{error}</p>}
    </div>
  );
}
