"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { submitQuizCheckpoint } from "@/lib/actions/skill-paths";
import { btn } from "@/components/aza/kit";
import type { QuizQuestion } from "@/lib/types";

type Result = {
  passed: boolean;
  correctCount: number;
  total: number;
  results: { correct: boolean; correctIndex: number; explanation: string | null }[];
  isFinal: boolean;
};

export default function QuizForm({
  checkpointId,
  pathId,
  questions,
  alreadyCompleted,
}: {
  checkpointId: string;
  pathId: string;
  questions: QuizQuestion[];
  alreadyCompleted: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [result, setResult] = useState<Result | null>(null);

  const allAnswered = answers.every((a) => a !== null);

  function submit() {
    if (!allAnswered) {
      toast.error("Answer every question before submitting.");
      return;
    }
    startTransition(async () => {
      try {
        const finalAnswers: number[] = answers.filter((a): a is number => a !== null);
        const res = await submitQuizCheckpoint(checkpointId, finalAnswers);
        setResult(res);
        if (res.passed) {
          toast.success(res.isFinal ? "Path complete! Your portfolio piece is live." : "Checkpoint passed!");
          router.refresh();
        } else {
          toast.error(`${res.correctCount}/${res.total} correct — review and try again.`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't submit quiz");
      }
    });
  }

  function retry() {
    setAnswers(questions.map(() => null));
    setResult(null);
  }

  if (alreadyCompleted && result === null) {
    return (
      <section className="rounded-lg border border-primary/30 bg-primary-soft p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-primary" />
          <p className="font-semibold text-primary-strong">Quiz passed</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {questions.map((q, qi) => {
        const qResult = result?.results[qi];
        return (
          <div key={qi} className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
            <p className="mb-3 font-semibold text-foreground">
              {qi + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const selected = answers[qi] === oi;
                const showCorrect = result && oi === qResult?.correctIndex;
                const showWrong = result && selected && !qResult?.correct;
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={Boolean(result) || isPending}
                    onClick={() =>
                      setAnswers((prev: (number | null)[]) => prev.map((a, i) => (i === qi ? oi : a)))
                    }
                    className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors ${
                      showCorrect
                        ? "border-primary bg-primary-soft text-primary-strong"
                        : showWrong
                          ? "border-destructive/40 bg-destructive/5 text-destructive"
                          : selected
                            ? "border-primary bg-primary-soft/50"
                            : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    <span
                      className={`grid size-5 shrink-0 place-items-center rounded-full border text-xs ${
                        selected ? "border-primary" : "border-muted-foreground"
                      }`}
                    >
                      {showCorrect ? (
                        <CheckCircle2 className="size-4 text-primary" />
                      ) : showWrong ? (
                        <XCircle className="size-4 text-destructive" />
                      ) : selected ? (
                        <span className="size-2.5 rounded-full bg-primary" />
                      ) : null}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {result && qResult?.explanation && (
              <p className="mt-3 text-xs text-muted-foreground">{qResult.explanation}</p>
            )}
          </div>
        );
      })}

      {!result && (
        <button type="button" onClick={submit} disabled={isPending || !allAnswered} className={`${btn.primary} w-full`}>
          {isPending ? "Checking..." : "Submit quiz"}
        </button>
      )}

      {result && !result.passed && (
        <button type="button" onClick={retry} className={`${btn.secondary} w-full`}>
          Try again
        </button>
      )}

      {result?.passed && result.isFinal && (
        <Link href={`/growth/skills/paths/${pathId}`} className={`${btn.primary} flex w-full`}>
          See your ratings
        </Link>
      )}
    </section>
  );
}
