"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { OpportunityCategory } from "@/lib/types";

const VALID_EMPLOYMENT_STATUSES = ["student", "employed", "self_employed", "unemployed", "freelancer", "other"] as const;
type EmploymentStatus = (typeof VALID_EMPLOYMENT_STATUSES)[number];

const VALID_JOB_TYPES = ["full_time", "part_time", "internship", "contract", "freelance", "volunteer"] as const;
const VALID_LEVELS = ["entry", "junior", "mid", "senior", "any"] as const;

function parseRelevantStatus(formData: FormData): EmploymentStatus[] {
  return formData
    .getAll("relevant_status")
    .filter((v): v is string => typeof v === "string")
    .filter((v): v is EmploymentStatus => (VALID_EMPLOYMENT_STATUSES as readonly string[]).includes(v));
}

function parseOptionalEnum<T extends string>(formData: FormData, field: string, valid: readonly T[]): T | null {
  const raw = formData.get(field) as string | null;
  return raw && (valid as readonly string[]).includes(raw) ? (raw as T) : null;
}

function parseOptionalString(formData: FormData, field: string): string | null {
  const raw = (formData.get(field) as string | null)?.trim();
  return raw ? raw : null;
}

function parseOptionalInt(formData: FormData, field: string): number | null {
  const raw = formData.get(field) as string | null;
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parsePaid(formData: FormData): boolean | null {
  const raw = formData.get("paid") as string | null;
  if (raw === "yes") return true;
  if (raw === "no") return false;
  return null;
}

export async function createOpportunity(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tags = (formData.get("tags") as string)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const relevantStatus = parseRelevantStatus(formData);
  const minAgeRaw = formData.get("min_age") as string;
  const maxAgeRaw = formData.get("max_age") as string;

  const { error } = await supabase.from("opportunities").insert({
    title: formData.get("title") as string,
    org: formData.get("org") as string,
    category: formData.get("category") as OpportunityCategory,
    description: formData.get("description") as string,
    eligibility: (formData.get("eligibility") as string) || null,
    deadline: (formData.get("deadline") as string) || null,
    apply_url: formData.get("apply_url") as string,
    location: (formData.get("location") as string) || null,
    remote: formData.get("remote") === "on",
    tags,
    curator_verified: formData.get("curator_verified") === "on",
    min_age: minAgeRaw ? parseInt(minAgeRaw, 10) : null,
    max_age: maxAgeRaw ? parseInt(maxAgeRaw, 10) : null,
    region: (formData.get("region") as string) || null,
    relevant_status: relevantStatus,
    created_by: user.id,
    logo_url: parseOptionalString(formData, "logo_url"),
    job_type: parseOptionalEnum(formData, "job_type", VALID_JOB_TYPES),
    salary_range: parseOptionalString(formData, "salary_range"),
    experience_required: parseOptionalString(formData, "experience_required"),
    level: parseOptionalEnum(formData, "level", VALID_LEVELS),
    applicants_count: parseOptionalInt(formData, "applicants_count"),
    paid: parsePaid(formData),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/curator");
  redirect("/curator");
}

export async function updateOpportunity(id: string, formData: FormData) {
  const supabase = await createClient();

  const tags = (formData.get("tags") as string)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const relevantStatus = parseRelevantStatus(formData);
  const minAgeRaw = formData.get("min_age") as string;
  const maxAgeRaw = formData.get("max_age") as string;

  const { error } = await supabase
    .from("opportunities")
    .update({
      title: formData.get("title") as string,
      org: formData.get("org") as string,
      category: formData.get("category") as OpportunityCategory,
      description: formData.get("description") as string,
      eligibility: (formData.get("eligibility") as string) || null,
      deadline: (formData.get("deadline") as string) || null,
      apply_url: formData.get("apply_url") as string,
      location: (formData.get("location") as string) || null,
      remote: formData.get("remote") === "on",
      tags,
      curator_verified: formData.get("curator_verified") === "on",
      min_age: minAgeRaw ? parseInt(minAgeRaw, 10) : null,
      max_age: maxAgeRaw ? parseInt(maxAgeRaw, 10) : null,
      region: (formData.get("region") as string) || null,
      relevant_status: relevantStatus,
      updated_at: new Date().toISOString(),
      logo_url: parseOptionalString(formData, "logo_url"),
      job_type: parseOptionalEnum(formData, "job_type", VALID_JOB_TYPES),
      salary_range: parseOptionalString(formData, "salary_range"),
      experience_required: parseOptionalString(formData, "experience_required"),
      level: parseOptionalEnum(formData, "level", VALID_LEVELS),
      applicants_count: parseOptionalInt(formData, "applicants_count"),
      paid: parsePaid(formData),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/curator");
  revalidatePath(`/opportunities/${id}`);
  redirect("/curator");
}

export async function deleteOpportunity(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("opportunities").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/curator");
}
