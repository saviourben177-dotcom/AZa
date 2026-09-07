// src/app/admin/page.tsx

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ count: businessCount }, { count: ideaLibraryCount }, { count: teamCount }] =
    await Promise.all([
      supabase.from("businesses").select("*", { count: "exact", head: true }),
      supabase.from("idea_library").select("*", { count: "exact", head: true }),
      supabase
        .from("ideas")
        .select("*", { count: "exact", head: true })
        .eq("looking_for_collaborators", true),
    ]);

  const { data: recentLog } = await supabase
    .from("admin_content_log")
    .select("action, table_name, summary, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Businesses" value={businessCount ?? 0} href="/admin/businesses" />
        <StatCard label="Idea Library" value={ideaLibraryCount ?? 0} href="/admin/idea-library" />
        <StatCard label="Open Teams" value={teamCount ?? 0} href="/admin/teams" />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-600">Recent admin actions</h2>
        <div className="rounded-lg border border-neutral-200 bg-white">
          {recentLog && recentLog.length > 0 ? (
            <ul className="divide-y divide-neutral-100">
              {recentLog.map((entry, i) => (
                <li key={i} className="flex justify-between px-4 py-2 text-sm">
                  <span>{entry.summary}</span>
                  <span className="text-neutral-400">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-sm text-neutral-400">No admin actions yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300"
    >
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </Link>
  );
}
