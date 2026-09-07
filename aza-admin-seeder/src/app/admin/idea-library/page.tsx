// src/app/admin/idea-library/page.tsx

import { createServerClient } from "@/lib/supabase/server";
import { getEditorialProfileId } from "@/lib/actions/admin/require-admin";
import { IdeaLibraryForm } from "./idea-library-form";
import { IdeaLibraryImportForm } from "./idea-library-import-form";

export default async function AdminIdeaLibraryPage() {
  const supabase = createServerClient();
  const editorialId = await getEditorialProfileId();

  const { data: entries } = await supabase
    .from("idea_library")
    .select("id, title, category, confidence")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-medium">Add an idea library entry</h2>
        <IdeaLibraryForm defaultOwnerId={editorialId} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Bulk import</h2>
        <IdeaLibraryImportForm defaultOwnerId={editorialId} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">
          Existing entries ({entries?.length ?? 0} shown, most recent first)
        </h2>
        <div className="rounded-lg border border-neutral-200 bg-white">
          <ul className="divide-y divide-neutral-100">
            {entries?.map((e) => (
              <li key={e.id} className="flex justify-between px-4 py-2 text-sm">
                <span>
                  {e.title} — <span className="text-neutral-400">{e.category}</span>
                </span>
                <span className="text-neutral-400">{e.confidence ?? "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
