"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { OpportunityCategory } from "@/lib/types";

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

  const relevantStatus = formData.getAll("relevant_status") as string[];
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

  const relevantStatus = formData.getAll("relevant_status") as string[];
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
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/curator");
  redirect("/curator");
}

export async function deleteOpportunity(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("opportunities").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/curator");
}
