"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface GradedResult {
  score: number;
  total: number;
  coinsAwarded: number;
  newBalance: number;
  explanationByQuestionId: Record<string, string | null>;
  correctByQuestionId: Record<string, number>;
}

/**
 * Submits a Prep attempt for server-side grading via grade_prep_attempt()
 * (see the schema migration) — the actual scoring and +10 coin award
 * happen in that Postgres function against the real answer key, which
 * this action never sees directly. The function itself returns an
 * answer_key payload scoped to exactly the submitted question ids
 * (added specifically so this action doesn't need its own query against
 * public.prep_questions, which has SELECT revoked from authenticated —
 * deliberately, so the answer key can never be read before grading).
 */
export async function gradePrepAttempt(
  fieldId: string,
  questionIds: string[],
  answers: Record<string, number>
): Promise<GradedResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("grade_prep_attempt", {
    p_field_id: fieldId,
    p_question_ids: questionIds,
    p_answers: answers,
  });
  if (error) throw new Error(error.message);

  const row = data?.[0];
  if (!row) throw new Error("No response from grade_prep_attempt");

  const answerKey = (row.answer_key ?? {}) as Record<string, { correct_option_index: number; explanation: string | null }>;

  const explanationByQuestionId: Record<string, string | null> = {};
  const correctByQuestionId: Record<string, number> = {};
  for (const [questionId, entry] of Object.entries(answerKey)) {
    explanationByQuestionId[questionId] = entry.explanation;
    correctByQuestionId[questionId] = entry.correct_option_index;
  }

  revalidatePath("/growth/prep");

  return {
    score: row.score,
    total: row.total,
    coinsAwarded: row.coins_awarded,
    newBalance: row.new_balance,
    explanationByQuestionId,
    correctByQuestionId,
  };
}
