import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn, Empty } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Team Finder — Aza",
  description: "Find founders looking for teammates, or recruit for your own idea.",
};

const ROLE_FILTERS = ["All", "Developer", "Designer", "Marketing", "AI/ML", "Finance"];

interface IdeaRole {
  role_name: string;
  slots_needed: number;
  slots_filled: number;
}

export default async function TeamFinderPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const supabase = await createClient();

  const { data: ideasRaw } = await supabase
    .from("ideas")
    .select("id, title, category, created_at, idea_roles(role_name, slots_needed, slots_filled)")
    .eq("looking_for_collaborators", true)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(50);

  let ideas = ideasRaw ?? [];
  if (role && role !== "All") {
    ideas = ideas.filter((idea) =>
      ((idea.idea_roles as unknown as IdeaRole[]) ?? []).some((r) =>
        r.role_name.toLowerCase().includes(role.toLowerCase())
      )
    );
  }

  return (
    <AppShell>
      <BackLink to="/businesses" label="Business" />
      <PageHeader
        title="Team Finder"
        sub="Teams looking for people like you"
        action={
          <div className="flex gap-2">
            <Link href="/growth/ideas/new?team=1" className={btn.primary}>
              Post project
            </Link>
            <Link href="/businesses/team-finder/my-requests" className={btn.secondary}>
              My requests
            </Link>
          </div>
        }
      />

      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {ROLE_FILTERS.map((r) => (
          <Link
            key={r}
            href={r === "All" ? "/businesses/team-finder" : `/businesses/team-finder?role=${r}`}
            className={`h-11 shrink-0 rounded-md border px-3.5 text-sm font-medium flex items-center ${
              (role ?? "All") === r
                ? "border-primary bg-primary-soft font-semibold text-primary-strong"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {r}
          </Link>
        ))}
      </div>

      {ideas.length === 0 ? (
        <Empty
          title="No open teams right now"
          sub="Check back soon, or post your own project to find collaborators."
          action={
            <Link href="/growth/ideas/new?team=1" className={btn.primary}>
              Post a project
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {ideas.map((idea) => {
            const roles = (idea.idea_roles as unknown as IdeaRole[]) ?? [];
            const openRoles = roles.filter((r) => r.slots_filled < r.slots_needed);
            const totalMembersNeeded = roles.reduce((sum, r) => sum + r.slots_needed, 0);
            return (
              <Link
                key={idea.id}
                href={`/businesses/team-finder/${idea.id}`}
                className="card-lift flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-border-strong"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-primary-strong">
                  {openRoles.length > 0
                    ? `Needs ${openRoles.map((r) => r.role_name).join(", ")}`
                    : "Team full"}
                </p>
                <h3 className="text-base font-semibold text-foreground">{idea.title}</h3>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  {idea.category && <Tag>{idea.category}</Tag>}
                  <Tag icon={<Users className="size-3.5" />}>
                    {totalMembersNeeded} {totalMembersNeeded === 1 ? "spot" : "spots"}
                  </Tag>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
