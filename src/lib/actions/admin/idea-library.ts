// src/lib/actions/admin/idea-library.ts
//
// idea_library already has RLS policies permitting role in
// ('curator','admin','editorial') to insert/update, and role='admin' to
// delete — these pre-date this seeder and were NOT modified. This file just
// gives the admin route a bulk/preview-friendly way to use paths that
// already exist.

"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "./require-admin";
import { logAdminAction } from "./audit";
import { parseImportFile, validateImportRows } from "./import";

// Mirrors public.idea_library's column constraints. Enum/impact-level
// fields are optional in this v1 form — the existing curator UI (if any)
// or a follow-up edit can fill in the scorecard fields later.
export const ideaLibrarySchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1),
  summary: z.string().max(500).optional().nullable(),
  description: z.string().min(1),
  is_novel_flag: z.boolean().optional(),
  competitors: z.array(z.string()).optional(),
  tech_stack: z.array(z.string()).optional(),
  mvp_features: z.array(z.string()).optional(),
  validation_checklist: z.array(z.string()).optional(),
  funding_options: z.array(z.string()).optional(),
  resources: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.number().int().min(1).max(5).optional().nullable(),
  capital_required: z.enum(["low", "medium", "high"]).optional().nullable(),
  time_to_mvp: z.string().optional().nullable(),
  market_competition: z.enum(["low", "medium", "high"]).optional().nullable(),
  validation_risk: z.enum(["low", "medium", "high"]).optional().nullable(),
  revenue_potential: z.enum(["low", "medium", "high"]).optional().nullable(),
  suitable_for: z.enum(["beginner", "intermediate", "advanced"]).optional().nullable(),
  confidence: z.enum(["high", "medium", "low"]).optional().nullable(),
  confidence_rationale: z.string().optional().nullable(),
});

export type IdeaLibraryInput = z.infer<typeof ideaLibrarySchema>;

export async function createIdeaLibraryEntry(input: IdeaLibraryInput, createdBy: string) {
  await requireAdmin();
  const supabase = await createClient();

  const parsed = ideaLibrarySchema.parse(input);

  const { data, error } = await supabase
    .from("idea_library")
    .insert({ ...parsed, created_by: createdBy, curator_verified: true })
    .select("id")
    .single();

  if (error) throw error;

  await logAdminAction({
    action: "create",
    tableName: "idea_library",
    recordId: data.id,
    summary: `Created idea library entry "${parsed.title}"`,
  });

  return data;
}

export async function updateIdeaLibraryEntry(id: string, input: Partial<IdeaLibraryInput>) {
  await requireAdmin();
  const supabase = await createClient();

  const parsed = ideaLibrarySchema.partial().parse(input);

  const { error } = await supabase.from("idea_library").update(parsed).eq("id", id);
  if (error) throw error;

  await logAdminAction({
    action: "update",
    tableName: "idea_library",
    recordId: id,
    summary: `Updated idea library entry ${id}`,
  });
}

export async function deleteIdeaLibraryEntry(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("idea_library").delete().eq("id", id);
  if (error) throw error;

  await logAdminAction({
    action: "delete",
    tableName: "idea_library",
    recordId: id,
    summary: `Deleted idea library entry ${id}`,
  });
}

export async function previewIdeaLibraryImport(fileText: string, format: "csv" | "json") {
  await requireAdmin();
  const rawRows = parseImportFile(fileText, format);
  return validateImportRows(rawRows, ideaLibrarySchema);
}

export async function commitIdeaLibraryImport(rows: IdeaLibraryInput[], createdBy: string) {
  await requireAdmin();
  const supabase = await createClient();

  const toInsert = rows.map((r) => ({
    ...r,
    created_by: createdBy,
    curator_verified: true,
  }));

  const { data, error } = await supabase.from("idea_library").insert(toInsert).select("id");
  if (error) throw error;

  await logAdminAction({
    action: "bulk_import",
    tableName: "idea_library",
    summary: `Bulk imported ${data.length} idea library entries`,
  });

  return data;
}
