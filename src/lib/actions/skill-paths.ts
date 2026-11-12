"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { evaluateCheckpointSubmission } from "@/lib/groq";
import type { LearningStyle } from "@/lib/types";

/**
 * Enrolls the current user in a skill path (or updates their learning style
 * if already enrolled). Delegates to the enroll_in_skill_path() DB function,
 * which atomically upserts user_skill_paths and seeds user_checkpoint_progress
 * rows (checkpoint 1 unlocked, the rest locked).
 */
export async function enrollInSkillPath(pathId: string, learningStyle?: LearningStyle) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("enroll_in_skill_path", {
    p_path_id: pathId,
    p_learning_style: learningStyle ?? undefined,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/growth/skills");
  revalidatePath(`/growth/skills/paths/${pathId}`);
}

/** Changes the learning style for a path the user is already enrolled in. */
export async function setLearningStyle(pathId: string, learningStyle: LearningStyle) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_skill_paths")
    .update({ learning_style: learningStyle })
    .eq("user_id", user.id)
    .eq("path_id", pathId);
  if (error) throw new Error(error.message);

  revalidatePath(`/growth/skills/paths/${pathId}`);
}

/**
 * Marks a non-submission checkpoint (a quick read/quiz with no work to
 * review) as done. Reuses the same completion path as a real submission —
 * an empty checkpoint_submissions row, auto-passed — so unlocking the next
 * checkpoint and streak/portfolio bookkeeping stay identical either way.
 * Only for checkpoints where requires_submission is false; the UI never
 * offers this button otherwise.
 */
export async function markMicroLessonComplete(checkpointId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: checkpoint, error: checkpointError } = await supabase
    .from("skill_checkpoints")
    .select("id, path_id, is_final, requires_submission")
    .eq("id", checkpointId)
    .single();
  if (checkpointError || !checkpoint) throw new Error("Checkpoint not found");
  if (checkpoint.requires_submission) throw new Error("This checkpoint needs a submission.");

  const { data: progress } = await supabase
    .from("user_checkpoint_progress")
    .select("status")
    .eq("user_id", user.id)
    .eq("checkpoint_id", checkpointId)
    .maybeSingle();
  if (!progress || progress.status === "locked") {
    throw new Error("This checkpoint isn't unlocked yet.");
  }
  if (progress.status === "completed") return;

  const { data: submission, error: insertError } = await supabase
    .from("checkpoint_submissions")
    .insert({
      user_id: user.id,
      checkpoint_id: checkpointId,
      path_id: checkpoint.path_id,
      submission_text: null,
      submission_url: null,
      status: "pending",
    })
    .select("id")
    .single();
  if (insertError || !submission) throw new Error(insertError?.message ?? "Couldn't mark complete");

  const { error: completeError } = await supabase.rpc("complete_skill_checkpoint", {
    p_submission_id: submission.id,
    p_status: "passed",
    p_portfolio_title: undefined,
    p_portfolio_description: undefined,
    p_portfolio_project_url: undefined,
    p_portfolio_tags: [],
  });
  if (completeError) throw new Error(completeError.message);

  revalidatePath(`/growth/skills/paths/${checkpoint.path_id}`);
  revalidatePath("/growth/skills");
  revalidatePath("/profile");
}

/**
 * Submits work for a checkpoint, runs it through AI evaluation, and
 * persists the honest result via complete_skill_checkpoint() — which
 * unlocks the next checkpoint and (on the final checkpoint) writes
 * completion ratings + a portfolio entry, but only ever on a genuine pass.
 * Returns the evaluation so the UI can show feedback immediately.
 */
export async function submitCheckpoint(
  checkpointId: string,
  input: { submissionText?: string; submissionUrl?: string; portfolio?: { title?: string; description?: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!input.submissionText?.trim() && !input.submissionUrl?.trim()) {
    throw new Error("Add some text or a link before submitting.");
  }

  const { data: checkpoint, error: checkpointError } = await supabase
    .from("skill_checkpoints")
    .select("id, path_id, title, description, learning_points, evaluation_criteria, is_final")
    .eq("id", checkpointId)
    .single();
  if (checkpointError || !checkpoint) throw new Error("Checkpoint not found");

  // Guard: don't allow submitting to a checkpoint the user hasn't unlocked yet.
  const { data: progress } = await supabase
    .from("user_checkpoint_progress")
    .select("status")
    .eq("user_id", user.id)
    .eq("checkpoint_id", checkpointId)
    .maybeSingle();
  if (!progress || progress.status === "locked") {
    throw new Error("This checkpoint isn't unlocked yet.");
  }

  const { data: submission, error: insertError } = await supabase
    .from("checkpoint_submissions")
    .insert({
      user_id: user.id,
      checkpoint_id: checkpointId,
      path_id: checkpoint.path_id,
      submission_text: input.submissionText?.trim() || null,
      submission_url: input.submissionUrl?.trim() || null,
      status: "pending",
    })
    .select("id")
    .single();
  if (insertError || !submission) throw new Error(insertError?.message ?? "Couldn't save submission");

  const evaluation = await evaluateCheckpointSubmission({
    checkpointTitle: checkpoint.title,
    checkpointDescription: checkpoint.description,
    learningPoints: checkpoint.learning_points ?? [],
    evaluationCriteria: checkpoint.evaluation_criteria,
    submissionText: input.submissionText ?? null,
    submissionUrl: input.submissionUrl ?? null,
  });

  const { error: updateError } = await supabase
    .from("checkpoint_submissions")
    .update({
      ai_feedback: evaluation.feedback,
      ai_strengths: evaluation.strengths,
      ai_gaps: evaluation.gaps,
    })
    .eq("id", submission.id);
  if (updateError) throw new Error(updateError.message);

  const { error: completeError } = await supabase.rpc("complete_skill_checkpoint", {
    p_submission_id: submission.id,
    p_status: evaluation.passed ? "passed" : "failed",
    p_portfolio_title: input.portfolio?.title ?? undefined,
    p_portfolio_description: input.portfolio?.description ?? undefined,
    p_portfolio_project_url: input.submissionUrl ?? undefined,
    p_portfolio_tags: [],
  });
  if (completeError) throw new Error(completeError.message);

  revalidatePath(`/growth/skills/paths/${checkpoint.path_id}`);
  revalidatePath("/growth/skills");
  revalidatePath("/profile");

  return {
    passed: evaluation.passed,
    feedback: evaluation.feedback,
    strengths: evaluation.strengths,
    gaps: evaluation.gaps,
    isFinal: checkpoint.is_final,
  };
}
