"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { submitCheckpoint } from "@/lib/actions/skill-paths";
import { btn, TextArea, TextField } from "@/components/aza/kit";
import type { CheckpointSubmission, SkillPathOutputKind } from "@/lib/types";

type Result = {
  passed: boolean;
  feedback: string;
  strengths: string[];
  gaps: string[];
  isFinal: boolean;
};

export default function SubmissionForm({
  checkpointId,
  pathId,
  isFinal,
  outputKind,
  alreadyPassed,
  latestFeedback,
}: {
  checkpointId: string;
  pathId: string;
  isFinal: boolean;
  outputKind: SkillPathOutputKind;
  alreadyPassed: boolean;
  latestFeedback: CheckpointSubmission | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(
    latestFeedback
      ? {
          passed: latestFeedback.status === "passed",
          feedback: latestFeedback.ai_feedback ?? "",
          strengths: latestFeedback.ai_strengths ?? [],
          gaps: latestFeedback.ai_gaps ?? [],
          isFinal,
        }
      : null
  );
  function submit(formData: FormData) {
    const submissionText = String(formData.get("submission_text") ?? "");
    const submissionUrl = String(formData.get("submission_url") ?? "");
    const portfolioTitle = String(formData.get("portfolio_title") ?? "");

    startTransition(async () => {
      try {
        const res = await submitCheckpoint(checkpointId, {
          submissionText,
          submissionUrl,
          portfolio: isFinal ? { title: portfolioTitle || undefined } : undefined,
        });
        setResult(res);
        if (res.passed) {
          toast.success(res.isFinal ? "Path complete! Your portfolio piece is live." : "Checkpoint passed!");
          router.refresh();
        } else {
          toast.error("Not quite there yet — see the feedback below.");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't submit");
      }
    });
  }

  if (alreadyPassed && result?.passed) {
    return (
      <section className="rounded-lg border border-primary/30 bg-primary-soft p-4">
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle2 className="size-5 text-primary" />
          <p className="font-semibold text-primary-strong">Checkpoint passed</p>
        </div>
        {result.feedback && <p className="text-sm text-muted-foreground">{result.feedback}</p>}
      </section>
    );
  }

  return (
    <section className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
      <p className="mb-3 font-semibold text-foreground">
        {isFinal
          ? outputKind === "artifact"
            ? "Submit your project"
            : "Submit your evidence"
          : "Submit your work"}
      </p>

      <form action={submit} className="space-y-4">
        <TextArea
          label="Describe what you did"
          name="submission_text"
          rows={4}
          placeholder="Explain your approach, what you built, or what happened..."
        />
        <TextField
          label={isFinal && outputKind === "artifact" ? "Live project URL" : "Link (optional)"}
          name="submission_url"
          placeholder="https://..."
        />

        {isFinal && (
          <div className="space-y-3 rounded-md border border-dashed p-3">
            <p className="text-xs font-semibold text-muted-foreground">
              If this passes, it becomes a portfolio entry on your profile.
            </p>
            <TextField label="Portfolio title" name="portfolio_title" placeholder="e.g. My personal portfolio site" />
          </div>
        )}

        <button type="submit" disabled={isPending} className={`${btn.primary} w-full`}>
          {isPending ? "Evaluating..." : "Submit for review"}
        </button>
      </form>

      {result && (
        <div
          className={`mt-4 rounded-lg border p-4 ${
            result.passed ? "border-primary/30 bg-primary-soft" : "border-destructive/30 bg-destructive/5"
          }`}
        >
          <div className="mb-2 flex items-center gap-2">
            {result.passed ? (
              <CheckCircle2 className="size-5 text-primary" />
            ) : (
              <XCircle className="size-5 text-destructive" />
            )}
            <p className={`font-semibold ${result.passed ? "text-primary-strong" : "text-destructive"}`}>
              {result.passed ? "Passed" : "Not yet — try again"}
            </p>
          </div>
          <p className="mb-2 text-sm text-foreground">{result.feedback}</p>
          {result.strengths.length > 0 && (
            <div className="mb-1 text-xs text-muted-foreground">
              <span className="font-semibold">Strengths: </span>
              {result.strengths.join(", ")}
            </div>
          )}
          {result.gaps.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold">To improve: </span>
              {result.gaps.join(", ")}
            </div>
          )}
          {result.passed && result.isFinal && (
            <Link href={`/growth/skills/paths/${pathId}`} className={`${btn.primary} mt-3 inline-flex`}>
              See your ratings
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
