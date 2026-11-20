"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Coins, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { btn } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";
import { gradePrepAttempt } from "@/lib/actions/prep";
import { COIN_BALANCE_EVENT } from "@/components/aza/coin-badge";
import type { Tables } from "@/lib/supabase/database.types";

export interface PrepQuestion {
  id: string;
  field_id: string;
  prompt: string;
  options: string[];
  explanation: string | null;
  difficulty: string;
}

interface GradedResult {
  score: number;
  total: number;
  coinsAwarded: number;
  newBalance: number;
  // explanation per question_id, filled in only after grading — the
  // component never has correct_option_index before this point, since
  // prep_questions_public doesn't expose it and grading happens
  // server-side.
  explanationByQuestionId: Record<string, string | null>;
  correctByQuestionId: Record<string, number>;
}

export default function QuizFlow({
  field,
  questions,
  isAuthed,
}: {
  field: Tables<"prep_fields">;
  questions: PrepQuestion[];
  isAuthed: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<GradedResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (questions.length === 0) {
    return (
      <>
        <PageHeader title={field.name} sub="No questions available yet" />
        <p className="text-sm text-muted-foreground">
          This field doesn&apos;t have any Prep questions yet — check back soon.
        </p>
      </>
    );
  }

  if (!isAuthed) {
    return (
      <>
        <PageHeader title={field.name} sub="Interview readiness quiz" />
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">Sign in to take this quiz and earn coins.</p>
          <button type="button" onClick={() => router.push("/login")} className={btn.primary}>
            Sign in
          </button>
        </div>
      </>
    );
  }

  if (result) {
    const percent = Math.round((result.score / result.total) * 100);
    return (
      <>
        <PageHeader title={field.name} sub="Quiz results" />
        <div className="mb-6 flex flex-col items-center gap-3 rounded-lg border bg-card p-8 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary-strong">
            <PartyPopper className="size-6" />
          </span>
          <p className="font-display text-2xl font-bold text-foreground">
            {result.score} / {result.total}
          </p>
          <p className="text-sm text-muted-foreground">{percent}% correct</p>
          <div className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold-light px-3 py-1.5 text-sm font-bold text-gold">
            <Coins className="size-4" /> +{result.coinsAwarded} coins
          </div>
        </div>

        <div className="space-y-3">
          {questions.map((q) => {
            const selected = answers[q.id];
            const correctIndex = result.correctByQuestionId[q.id];
            const wasCorrect = selected === correctIndex;
            const options = q.options;
            return (
              <div key={q.id} className="rounded-lg border bg-card p-4">
                <div className="mb-2 flex items-start gap-2">
                  {wasCorrect ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  )}
                  <p className="text-sm font-semibold text-foreground">{q.prompt}</p>
                </div>
                <p className="ml-6 text-sm text-muted-foreground">
                  Correct answer: <span className="font-medium text-foreground">{options[correctIndex]}</span>
                </p>
                {result.explanationByQuestionId[q.id] ? (
                  <p className="ml-6 mt-1.5 text-sm text-muted-foreground">{result.explanationByQuestionId[q.id]}</p>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex gap-2">
          <button type="button" onClick={() => router.push(`/growth/prep/${field.slug}`)} className={btn.secondary}>
            Try again
          </button>
          <button type="button" onClick={() => router.push("/growth/prep")} className={btn.primary}>
            Back to Prep
          </button>
        </div>
      </>
    );
  }

  const question = questions[current];
  const options = question.options;
  const selectedIndex = answers[question.id];
  const isLast = current === questions.length - 1;

  function selectOption(index: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: index }));
  }

  function handleNext() {
    if (isLast) {
      startTransition(async () => {
        try {
          const graded = await gradePrepAttempt(field.id, questions.map((q) => q.id), answers);
          setResult(graded);
          window.dispatchEvent(new CustomEvent(COIN_BALANCE_EVENT, { detail: { balance: graded.newBalance } }));
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Couldn't submit your answers.");
        }
      });
    } else {
      setCurrent((c) => c + 1);
    }
  }

  return (
    <>
      <PageHeader title={field.name} sub={`Question ${current + 1} of ${questions.length}`} />

      <div className="mb-5 flex gap-1.5">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= current ? "bg-primary" : "bg-border"}`}
          />
        ))}
      </div>

      <div className="rounded-lg border bg-card p-5">
        <Tag tone="primary">{question.difficulty}</Tag>
        <p className="mt-3 text-base font-display font-bold leading-snug text-foreground">{question.prompt}</p>

        <div className="mt-4 space-y-2">
          {options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectOption(i)}
              className={`w-full rounded-md border p-3 text-left text-sm font-medium transition-colors ${
                selectedIndex === i
                  ? "border-primary bg-primary-soft text-primary-strong"
                  : "bg-background text-foreground hover:bg-accent"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={selectedIndex === undefined || isPending}
        className={`${btn.primary} mt-5 w-full`}
      >
        {isPending ? "Submitting…" : isLast ? "Submit" : "Next"}
      </button>
    </>
  );
}
