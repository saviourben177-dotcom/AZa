"use client";

import { useState, useTransition, useEffect } from "react";
import { tailorCvForOpportunityId, getTailoredCv } from "@/lib/actions/cv-generate";

export default function OpportunityCvTailor({ opportunityId }: { opportunityId: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTailoredCv(opportunityId)
      .then((row) => setContent(row?.content ?? null))
      .finally(() => setLoaded(true));
  }, [opportunityId]);

  function handleTailor() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await tailorCvForOpportunityId(opportunityId);
        setContent(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not tailor CV");
      }
    });
  }

  if (!loaded) return null;

  return (
    <div className="rounded-card bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-ink">CV for this opportunity</p>
        {content && (
          <a
            href={`/api/cv/export?opportunityId=${opportunityId}`}
            className="text-[11.5px] font-semibold text-aza"
          >
            Download .docx
          </a>
        )}
      </div>

      {!content && (
        <p className="mt-1.5 text-[12px] text-text-secondary">
          Tailor your base CV to highlight what matters for this opportunity.
        </p>
      )}

      <button
        onClick={handleTailor}
        disabled={isPending}
        className="mt-2.5 w-full rounded-card bg-paper-dim py-2.5 text-[12.5px] font-semibold text-ink/70 disabled:opacity-60"
      >
        {isPending ? "Tailoring..." : content ? "Re-tailor for this opportunity" : "Tailor my CV for this"}
      </button>

      {error && <p className="mt-2 text-[12px] font-medium text-danger">{error}</p>}

      {content && (
        <div className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-card bg-paper-dim p-3 text-[12px] leading-relaxed text-ink/75">
          {content}
        </div>
      )}
    </div>
  );
}
