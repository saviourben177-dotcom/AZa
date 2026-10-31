"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const VALID_SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const;
type SkillLevel = (typeof VALID_SKILL_LEVELS)[number];

const VALID_RESOURCE_TYPES = ["course", "article", "video", "tool"] as const;
type ResourceType = (typeof VALID_RESOURCE_TYPES)[number];

export type CreateSkillResourceResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Guards against the exact mistake this form exists to prevent: a curator
 * picking a skill_id that doesn't actually exist (e.g. a stale option from
 * a cached page, or a tampered request) and silently writing a resource
 * that resolves to nothing in the UI. The dropdown is grouped by category
 * in the form itself (course-form.tsx) so category/skill mismatches
 * shouldn't happen in normal use — this is the server-side backstop, not
 * the primary defense.
 */
export async function createSkillResource(formData: FormData): Promise<CreateSkillResourceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const skillId = formData.get("skill_id") as string | null;
  const title = (formData.get("title") as string | null)?.trim();
  const url = (formData.get("url") as string | null)?.trim();

  if (!skillId) return { ok: false, error: "Pick a skill before saving." };
  if (!title) return { ok: false, error: "Title is required." };
  if (!url) return { ok: false, error: "Link (URL) is required." };

  const { data: skill } = await supabase.from("skills").select("id").eq("id", skillId).maybeSingle();
  if (!skill) return { ok: false, error: "That skill no longer exists — refresh the page and pick again." };

  const rawLevel = formData.get("level") as string | null;
  const level: SkillLevel = (VALID_SKILL_LEVELS as readonly string[]).includes(rawLevel ?? "")
    ? (rawLevel as SkillLevel)
    : "beginner";

  const rawType = formData.get("resource_type") as string | null;
  const resourceType: ResourceType = (VALID_RESOURCE_TYPES as readonly string[]).includes(rawType ?? "")
    ? (rawType as ResourceType)
    : "course";

  const { error } = await supabase.from("skill_resources").insert({
    skill_id: skillId,
    title,
    provider: (formData.get("provider") as string)?.trim() || null,
    url,
    resource_type: resourceType,
    level,
    duration_hours: formData.get("duration_hours") ? parseFloat(formData.get("duration_hours") as string) : null,
    is_free: formData.get("is_free") === "on",
    rating: formData.get("rating") ? parseFloat(formData.get("rating") as string) : null,
    curator_verified: formData.get("curator_verified") === "on",
    created_by: user.id,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/growth/courses");
  revalidatePath("/curator/courses");
  return { ok: true };
}

export async function deleteSkillResource(id: string) {
  const supabase = await createClient();
  await supabase.from("skill_resources").delete().eq("id", id);
  revalidatePath("/growth/courses");
  revalidatePath("/curator/courses");
}
