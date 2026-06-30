"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { EducationEntry, ExperienceEntry, CertificationEntry } from "@/lib/cv-types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

/** Ensures a cv_profiles row exists for the user and returns it. */
export async function getOrCreateCvProfile() {
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("cv_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("cv_profiles")
    .insert({ user_id: user.id })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return created;
}

export async function updateCvSummary(summary: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("cv_profiles")
    .update({ summary })
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/profile/cv");
}

export async function updateCvSkills(skills: string[]) {
  const { supabase, user } = await requireUser();
  const cleaned = skills.map((s) => s.trim()).filter(Boolean);
  const { error } = await supabase
    .from("cv_profiles")
    .update({ skills: cleaned })
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/profile/cv");
}

export async function upsertEducationEntry(entry: EducationEntry) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("cv_profiles")
    .select("education")
    .eq("user_id", user.id)
    .single();

  const current: EducationEntry[] = profile?.education ?? [];
  const idx = current.findIndex((e) => e.id === entry.id);
  const next = idx >= 0 ? current.map((e, i) => (i === idx ? entry : e)) : [...current, entry];

  const { error } = await supabase.from("cv_profiles").update({ education: next }).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/profile/cv");
}

export async function removeEducationEntry(entryId: string) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("cv_profiles")
    .select("education")
    .eq("user_id", user.id)
    .single();
  const next = (profile?.education ?? []).filter((e: EducationEntry) => e.id !== entryId);
  const { error } = await supabase.from("cv_profiles").update({ education: next }).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/profile/cv");
}

export async function upsertExperienceEntry(entry: ExperienceEntry) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("cv_profiles")
    .select("experience")
    .eq("user_id", user.id)
    .single();

  const current: ExperienceEntry[] = profile?.experience ?? [];
  const idx = current.findIndex((e) => e.id === entry.id);
  const next = idx >= 0 ? current.map((e, i) => (i === idx ? entry : e)) : [...current, entry];

  const { error } = await supabase.from("cv_profiles").update({ experience: next }).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/profile/cv");
}

export async function removeExperienceEntry(entryId: string) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("cv_profiles")
    .select("experience")
    .eq("user_id", user.id)
    .single();
  const next = (profile?.experience ?? []).filter((e: ExperienceEntry) => e.id !== entryId);
  const { error } = await supabase.from("cv_profiles").update({ experience: next }).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/profile/cv");
}

export async function upsertCertificationEntry(entry: CertificationEntry) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("cv_profiles")
    .select("certifications")
    .eq("user_id", user.id)
    .single();

  const current: CertificationEntry[] = profile?.certifications ?? [];
  const idx = current.findIndex((e) => e.id === entry.id);
  const next = idx >= 0 ? current.map((e, i) => (i === idx ? entry : e)) : [...current, entry];

  const { error } = await supabase.from("cv_profiles").update({ certifications: next }).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/profile/cv");
}

export async function removeCertificationEntry(entryId: string) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("cv_profiles")
    .select("certifications")
    .eq("user_id", user.id)
    .single();
  const next = (profile?.certifications ?? []).filter((e: CertificationEntry) => e.id !== entryId);
  const { error } = await supabase.from("cv_profiles").update({ certifications: next }).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/profile/cv");
}
