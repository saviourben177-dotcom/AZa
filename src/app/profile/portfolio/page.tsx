import { redirect } from "next/navigation";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { PortfolioEntry, SkillPath } from "@/lib/types";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, Empty } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile/portfolio");

  const { data: entries } = await supabase
    .from("portfolio_entries")
    .select("*, skill_paths(title, output_kind)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const typedEntries = (entries ?? []) as (PortfolioEntry & { skill_paths: Pick<SkillPath, "title" | "output_kind"> })[];

  return (
    <AppShell>
      <BackLink to="/profile" label="Profile" />
      <PageHeader title="Portfolio" sub="Verified work from completed skill paths." />

      {typedEntries.length === 0 ? (
        <Empty
          title="No portfolio entries yet"
          sub="Complete a Skill Path's final checkpoint to add a verified project here."
          action={
            <a href="/growth/skills/paths" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground">
              Browse Skill Paths
            </a>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {typedEntries.map((entry) => (
            <li key={entry.id} className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="font-bold text-foreground">{entry.title}</span>
                {entry.verified && (
                  <Tag tone="primary" icon={<BadgeCheck className="size-3.5" />}>
                    Verified
                  </Tag>
                )}
              </div>
              {entry.description && <p className="mb-2 text-sm text-muted-foreground">{entry.description}</p>}
              <p className="mb-2 text-xs text-muted-foreground">From: {entry.skill_paths?.title}</p>
              {entry.project_url && (
                <a
                  href={entry.project_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary-strong hover:underline"
                >
                  View project <ExternalLink className="size-3.5" />
                </a>
              )}
              {entry.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {entry.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
