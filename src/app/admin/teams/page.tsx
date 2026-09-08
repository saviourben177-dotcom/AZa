// src/app/admin/teams/page.tsx
//
// Deliberately does not offer any way to "add members" — see
// src/lib/actions/admin/teams.ts for why. Real users join through the
// existing Team Finder request/accept flow, untouched by this tool.
//
// This page now creates and lists BOTH normal Idea posts and Teams (ideas
// with open roles) — the "This is a team" checkbox on the form decides
// which. The listing below is scoped to ideas owned by @Aza or the current
// admin, since those are the only two identities this tool can post as;
// there's no new "created via admin" column, so this scoping is how we
// avoid showing every organic user idea in what's meant to be a seeding
// tool's own view.

import { createClient } from "@/lib/supabase/server";
import { getEditorialProfileId, requireAdmin } from "@/lib/actions/admin/require-admin";
import { TeamForm } from "./team-form";
import { IdeaImportForm } from "./idea-import-form";

export default async function AdminTeamsPage() {
  const supabase = await createClient();
  const admin = await requireAdmin();
  const editorialId = await getEditorialProfileId();

  const { data: posts } = await supabase
    .from("ideas")
    .select("id, title, stage, looking_for_collaborators, idea_roles(role_name, slots_needed, slots_filled)")
    .in("user_id", [editorialId, admin.userId])
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        This tool creates a post&apos;s idea and, for teams, its open roles
        only. It does not assign members — real users join through the
        normal Team Finder flow. This keeps join requests, notifications,
        and push notifications honest: nothing here ever looks like
        activity that didn&apos;t happen.
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Create an idea or team</h2>
        <TeamForm defaultOwnerId={editorialId} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Bulk import</h2>
        <IdeaImportForm defaultOwnerId={editorialId} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">
          Posts created here ({posts?.length ?? 0})
        </h2>
        <div className="rounded-lg border border-neutral-200 bg-white">
          <ul className="divide-y divide-neutral-100">
            {posts?.map((p) => (
              <li key={p.id} className="px-4 py-3 text-sm">
                <p className="font-medium">
                  {p.title}{" "}
                  <span className="font-normal text-neutral-400">
                    {p.looking_for_collaborators ? "· Team" : "· Idea"}
                  </span>
                </p>
                {p.looking_for_collaborators && (
                  <ul className="mt-1 space-y-0.5 text-neutral-500">
                    {p.idea_roles?.map((r, i) => (
                      <li key={i}>
                        {r.role_name}: {r.slots_filled}/{r.slots_needed} filled
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
