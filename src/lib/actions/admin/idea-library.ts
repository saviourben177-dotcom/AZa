// src/lib/actions/admin/idea-library.ts
//
// idea_library already has RLS policies permitting role in
// ('curator','admin','editorial') to insert/update, and role='admin' to
// delete — these pre-date this seeder and were NOT modified. This file just
// gives the admin route a bulk/preview-friendly way to use paths that
// already exist.

"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "./require-admin";
import { logAdminAction } from "./audit";
import { parseImportFile, validateImportRows } from "./import";
import { ideaLibrarySchema, type IdeaLibraryInput } from "./idea-library-schema";

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
