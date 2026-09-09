// src/lib/actions/admin/businesses.ts
//
// Writes rely entirely on RLS: the "businesses_editorial_write/update/delete"
// policies (added in the seeder migration) permit this only for profiles
// with role in ('editorial','admin'). No service-role key is used anywhere
// in this file — the caller's normal authenticated session does the work,
// so a bug here cannot bypass RLS.

"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "./require-admin";
import { logAdminAction } from "./audit";
import { parseImportFile, validateImportRows } from "./import";
import { businessSchema, type BusinessInput } from "./business-schema";

export async function createBusiness(input: BusinessInput, createdBy: string) {
  await requireAdmin();
  const supabase = await createClient();

  const parsed = businessSchema.parse(input);

  const { data, error } = await supabase
    .from("businesses")
    .insert({ ...parsed, created_by: createdBy, curator_verified: true })
    .select("id")
    .single();

  if (error) throw error;

  await logAdminAction({
    action: "create",
    tableName: "businesses",
    recordId: data.id,
    summary: `Created business "${parsed.name}"`,
  });

  return data;
}

export async function updateBusiness(id: string, input: Partial<BusinessInput>) {
  await requireAdmin();
  const supabase = await createClient();

  const parsed = businessSchema.partial().parse(input);

  const { error } = await supabase.from("businesses").update(parsed).eq("id", id);
  if (error) throw error;

  await logAdminAction({
    action: "update",
    tableName: "businesses",
    recordId: id,
    summary: `Updated business ${id}`,
  });
}

export async function deleteBusiness(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("businesses").delete().eq("id", id);
  if (error) throw error;

  await logAdminAction({
    action: "delete",
    tableName: "businesses",
    recordId: id,
    summary: `Deleted business ${id}`,
  });
}

/**
 * Preview step only — parses and validates, does not write to the DB.
 * Call commitBusinessImport with the returned valid rows to actually insert.
 */
export async function previewBusinessImport(fileText: string, format: "csv" | "json") {
  await requireAdmin();
  const rawRows = parseImportFile(fileText, format);
  return validateImportRows(rawRows, businessSchema);
}

export async function commitBusinessImport(rows: BusinessInput[], createdBy: string) {
  await requireAdmin();
  const supabase = await createClient();

  const toInsert = rows.map((r) => ({
    ...r,
    created_by: createdBy,
    curator_verified: true,
  }));

  const { data, error } = await supabase.from("businesses").insert(toInsert).select("id");
  if (error) throw error;

  await logAdminAction({
    action: "bulk_import",
    tableName: "businesses",
    summary: `Bulk imported ${data.length} businesses`,
  });

  return data;
}
