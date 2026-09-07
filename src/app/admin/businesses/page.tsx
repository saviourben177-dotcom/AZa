// src/app/admin/businesses/page.tsx
//
// Note: per the final scope decision, day-to-day business seeding is
// expected to happen via Supabase's own Table Editor CSV import (faster,
// zero code). This page exists mainly for: (a) single-record create/edit
// when you want validation + audit logging, and (b) bulk import when you
// want the preview/validation step before committing, which the raw Table
// Editor import doesn't give you. Use whichever is faster for the task at
// hand — both write to the same table under the same RLS.

import { createClient } from "@/lib/supabase/server";
import { getEditorialProfileId } from "@/lib/actions/admin/require-admin";
import { BusinessForm } from "./business-form";
import { BusinessImportForm } from "./business-import-form";

export default async function AdminBusinessesPage() {
  const supabase = await createClient();
  const editorialId = await getEditorialProfileId();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, category, state, curator_verified")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-medium">Add a business</h2>
        <BusinessForm defaultOwnerId={editorialId} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Bulk import</h2>
        <BusinessImportForm defaultOwnerId={editorialId} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">
          Existing businesses ({businesses?.length ?? 0} shown, most recent first)
        </h2>
        <div className="rounded-lg border border-neutral-200 bg-white">
          <ul className="divide-y divide-neutral-100">
            {businesses?.map((b) => (
              <li key={b.id} className="flex justify-between px-4 py-2 text-sm">
                <span>
                  {b.name} — <span className="text-neutral-400">{b.category}</span>
                </span>
                <span className="text-neutral-400">{b.state ?? "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
