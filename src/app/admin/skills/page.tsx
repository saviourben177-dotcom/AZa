// src/app/admin/skills/page.tsx
//
// Bulk import for skill_paths + skill_checkpoints. Unlike businesses/
// idea-library, there's no single-record create form here — a skill path
// always needs at least one checkpoint, and checkpoint content (learning
// points, per-style bodies) is naturally multi-paragraph, so JSON import is
// the primary path. See skill-path-import-form.tsx and skill-path-schema.ts
// for the exact shape an import file must match.

import { createClient } from "@/lib/supabase/server";
import { getEditorialProfileId } from "@/lib/actions/admin/require-admin";
import { SkillPathImportForm } from "./skill-path-import-form";

export default async function AdminSkillsPage() {
  const supabase = await createClient();
  const editorialId = await getEditorialProfileId();

  const { data: paths } = await supabase
    .from("skill_paths")
    .select("id, slug, title, category, is_published, sort_order")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  const pathIds = paths?.map((p) => p.id) ?? [];
  const { data: checkpointCounts } =
    pathIds.length > 0
      ? await supabase.from("skill_checkpoints").select("path_id").in("path_id", pathIds)
      : { data: [] as { path_id: string }[] };

  const countByPath = new Map<string, number>();
  for (const row of checkpointCounts ?? []) {
    countByPath.set(row.path_id, (countByPath.get(row.path_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-medium">Bulk import skill paths</h2>
        <SkillPathImportForm defaultOwnerId={editorialId} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">
          Existing skill paths ({paths?.length ?? 0}), grouped by category
        </h2>
        <div className="rounded-lg border border-neutral-200 bg-white">
          <ul className="divide-y divide-neutral-100">
            {paths?.map((p) => (
              <li key={p.id} className="flex justify-between px-4 py-2 text-sm">
                <span>
                  <span className="text-neutral-400">{p.category}</span> — {p.title}{" "}
                  {!p.is_published && <span className="text-amber-600">(unpublished)</span>}
                </span>
                <span className="text-neutral-400">{countByPath.get(p.id) ?? 0} checkpoint(s)</span>
              </li>
            ))}
            {(!paths || paths.length === 0) && (
              <li className="px-4 py-2 text-sm text-neutral-400">No skill paths yet.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
