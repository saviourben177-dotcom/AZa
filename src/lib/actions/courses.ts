"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UnlockCourseResult =
  | { success: true; newBalance: number; reason: "free" | "unlocked" }
  | { success: false; newBalance: number; reason: "insufficient_balance" | "course_not_found" };

/**
 * Thin wrapper around the unlock_course() Postgres function (see
 * supabase/migrations/20261118091100_courses_prep_coins_schema.sql) — all
 * the actual coin math, balance checks, and unlock_attempts logging
 * happen server-side in that function so a client can never fabricate a
 * successful unlock or a fake balance.
 */
export async function unlockCourse(courseId: string): Promise<UnlockCourseResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("unlock_course", { p_course_id: courseId });
  if (error) throw new Error(error.message);

  const row = data?.[0];
  if (!row) throw new Error("No response from unlock_course");

  revalidatePath(`/growth/courses/${courseId}`);
  revalidatePath("/growth/courses");

  if (row.success) {
    return { success: true, newBalance: row.new_balance, reason: row.reason as "free" | "unlocked" };
  }
  return { success: false, newBalance: row.new_balance, reason: row.reason as "insufficient_balance" | "course_not_found" };
}

/**
 * Saves reading position (0-100) for the flowable reader / pdf fallback.
 * Called on scroll-stop, not on every scroll event — see the reader
 * component's own debounce. Marks completed_at once progress reaches 95%+
 * (treated as "finished" rather than requiring a literal 100%, since a
 * flowed last paragraph or a PDF's final blank page can make exact 100%
 * unreliable to detect).
 */
export async function saveCourseProgress(courseId: string, progressPercent: number): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return; // Reading progress for a signed-out visitor is simply not tracked — not an error.

  const clamped = Math.max(0, Math.min(100, Math.round(progressPercent)));
  const isCompleted = clamped >= 95;

  const { error } = await supabase
    .from("course_progress")
    .upsert(
      {
        user_id: user.id,
        course_id: courseId,
        progress_percent: clamped,
        last_opened_at: new Date().toISOString(),
        ...(isCompleted ? { completed_at: new Date().toISOString() } : {}),
      },
      { onConflict: "user_id,course_id" }
    );

  if (error) throw new Error(error.message);
  revalidatePath("/growth/courses");
}

/** Called once when a course is first opened, to stamp last_opened_at even before any scroll progress exists. */
export async function recordCourseOpened(courseId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("course_progress")
    .upsert(
      { user_id: user.id, course_id: courseId, last_opened_at: new Date().toISOString() },
      { onConflict: "user_id,course_id" }
    );

  if (error) throw new Error(error.message);
}
