// src/lib/actions/admin/skill-paths.ts
//
// Writes rely entirely on RLS: "skill_paths_write_curator" and
// "skill_checkpoints_write_curator" (see 20261025182828_skills_paths_feature.sql)
// permit this only for profiles with role in ('curator','admin'). No
// service-role key is used — the caller's normal authenticated session does
// the work, same pattern as businesses.ts.
//
// Self-sorting import: each skill path in the import file carries its own
// unique `slug`, and each checkpoint carries its own `order` within that
// path (also unique per path in the DB). commitSkillPathImport upserts on
// those keys, so:
//   - an existing path's slug -> its checkpoints are added/updated in place
//   - a new slug -> a new path is created
//   - re-importing a corrected file for the same path/checkpoint never
//     creates duplicates, it just updates the existing row
// This is what makes "drop in a JSON file" land content in the right place
// without the person importing it needing to know any database id.

"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "./require-admin";
import { logAdminAction } from "./audit";
import { parseImportFile, validateImportRows, type ImportPreview } from "./import";
import { skillPathInputSchema, type SkillPathInput } from "./skill-path-schema";

/**
 * Preview step only — parses and validates, does not write to the DB.
 * Unlike the flat businesses/idea-library imports, this file format is an
 * array of nested objects (path + checkpoints), so it only supports JSON,
 * not CSV — a checkpoint's content_by_style and learning_points don't have
 * a sane flat CSV representation.
 */
export async function previewSkillPathImport(fileText: string): Promise<ImportPreview<SkillPathInput>> {
  await requireAdmin();
  const rawRows = parseImportFile(fileText, "json");
  return validateImportRows(rawRows, skillPathInputSchema);
}

/**
 * Commits a batch of validated skill paths (each with nested checkpoints).
 * For each path: upsert by `slug` (creates if new, updates fields if the
 * slug already exists). For each of its checkpoints: upsert by
 * (path_id, order) the same way. created_by is stamped on new paths only.
 */
export async function commitSkillPathImport(paths: SkillPathInput[], createdBy: string) {
  await requireAdmin();
  const supabase = await createClient();

  let pathsWritten = 0;
  let checkpointsWritten = 0;

  for (const path of paths) {
    const { checkpoints, ...pathFields } = path;

    const { data: upsertedPath, error: pathError } = await supabase
      .from("skill_paths")
      .upsert(
        { ...pathFields, created_by: createdBy },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (pathError || !upsertedPath) {
      throw new Error(`Failed to upsert path "${path.slug}": ${pathError?.message ?? "unknown error"}`);
    }
    pathsWritten += 1;

    const checkpointRows = checkpoints.map((c) => ({
      path_id: upsertedPath.id,
      order: c.order,
      title: c.title,
      description: c.description ?? null,
      learning_points: c.learning_points,
      content_by_style: c.content_by_style,
      is_final: c.is_final,
      requires_submission: c.requires_submission,
      evaluation_criteria: c.evaluation_criteria ?? null,
    }));

    const { error: checkpointError, data: checkpointData } = await supabase
      .from("skill_checkpoints")
      .upsert(checkpointRows, { onConflict: "path_id,order" })
      .select("id");

    if (checkpointError) {
      throw new Error(
        `Path "${path.slug}" was saved, but its checkpoints failed: ${checkpointError.message}`
      );
    }
    checkpointsWritten += checkpointData?.length ?? 0;
  }

  await logAdminAction({
    action: "bulk_import",
    tableName: "skill_paths",
    summary: `Bulk imported ${pathsWritten} skill path(s) with ${checkpointsWritten} checkpoint(s) total`,
  });

  return { pathsWritten, checkpointsWritten };
}
