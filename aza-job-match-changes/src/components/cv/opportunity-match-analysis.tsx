"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, CircleAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { btn } from "@/components/aza/kit";
import { cn } from "@/lib/utils";
import {
  analyzeOpportunityMatchForId,
  getOpportunityMatchAnalysis,
  type OpportunityMatchAnalysis,
} from "@/lib/actions/job-match";

/**
 * Standalone "Job Match Analysis" — the fast, free "am I wasting my time
 * applying" check. Separate from OpportunityCvTailor (tailoring a full CV):
 * this only scores fit and lists specific gaps, so a user can decide
 * whether tailoring/applying is worth their time before committing to it.
 *
 * Access gating: there is currently no access-tier/unlock column in the
 * live schema (confirmed via Supabase MCP before building this), so this
 * component has no locked state yet. If/when an unlock column is added,
 * gate the "Check my match" button here — e.g. pass a `locked` prop down
 * from the server component (opportunity-detail-client's parent) and
 * render an upgrade-prompt state instead of the button below. Do not wire
 * an actual payment flow here — just the UI gate.
 */
export default function OpportunityMatchAnalysisCard({ opportunityId }: { opportunityId: string }) {
  const [analysis, setAnalysis] = useState<OpportunityMatchAnalysis | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOpportunityMatchAnalysis(opportunityId)
      .then(setAnalysis)
      .finally(() => setLoaded(true));
  }, [opportunityId]);

  function handleAnalyze() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await analyzeOpportunityMatchForId(opportunityId);
        if (!result.ok) {
          setError("Add your details in the CV builder first so we can check your fit.");
          return;
        }
        setAnalysis(result.analysis);
      } catch (err) {
        toast.error("Could not analyze match");
        setError(err instanceof Error ? err.message : "Could not analyze match");
      }
    });
  }

  if (!loaded) return null;

  const scoreTone =
    analysis && analysis.match_score >= 70
      ? "text-primary-strong"
      : analysis && analysis.match_score >= 40
        ? "text-foreground"
        : "text-urgent";

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-bold">
          <Sparkles className="size-4 text-primary" /> Job Match Analysis
        </p>
        {analysis && (
          <span className={cn("text-base font-display font-extrabold", scoreTone)}>
            {analysis.match_score}%
          </span>
        )}
      </div>

      {!analysis && (
        <p className="mt-1.5 text-sm text-muted-foreground">
          See your fit score and exactly what's missing before you tailor a CV or apply.
        </p>
      )}

      {analysis && (
        <div className="mt-3 space-y-3">
          {analysis.summary && <p className="text-sm text-foreground/85">{analysis.summary}</p>}

          {analysis.matched_requirements.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                You match
              </p>
              <ul className="mt-1.5 space-y-1">
                {analysis.matched_requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-sm text-foreground/85">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.missing_requirements.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Gaps to address
              </p>
              <ul className="mt-1.5 space-y-1">
                {analysis.missing_requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-sm text-foreground/85">
                    <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-urgent" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button
        className={cn(btn.secondary, "mt-3 w-full justify-center")}
        disabled={isPending}
        onClick={handleAnalyze}
      >
        {isPending ? "Analyzing..." : analysis ? "Re-check my match" : "Check my match"}
      </button>

      {error && <p className="mt-2 text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}
