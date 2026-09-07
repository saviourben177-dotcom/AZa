// src/app/admin/teams/page.tsx
//
// Deliberately does not offer any way to "add members" — see
// src/lib/actions/admin/teams.ts for why. Real users join through the
// existing Team Finder request/accept flow, untouched by this tool.

import { createServerClient } from "@/lib/supabase/server";
import { TeamForm } from "./team-form";

export default async function AdminTeamsPage() {
  const supabase = createServerClient();

  const { data: teams } = await supabase
    .from("ideas")
    .select("id, title, stage, idea_roles(role_name, slots_needed, slots_filled)")
    .eq("looking_for_collaborators", true)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        This tool creates a team&apos;s idea and open roles only. It does not
        assign members — real users join through the normal Team Finder flow.
        This keeps join requests, notifications, and push notifications
        honest: nothing here ever looks like activity that didn&apos;t
        happen.
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Create a team</h2>
        <TeamForm />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">
          Existing open teams ({teams?.length ?? 0})
        </h2>
        <div className="rounded-lg border border-neutral-200 bg-white">
          <ul className="divide-y divide-neutral-100">
            {teams?.map((t) => (
              <li key={t.id} className="px-4 py-3 text-sm">
                <p className="font-medium">{t.title}</p>
                <ul className="mt-1 space-y-0.5 text-neutral-500">
                  {t.idea_roles?.map((r, i) => (
                    <li key={i}>
                      {r.role_name}: {r.slots_filled}/{r.slots_needed} filled
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
