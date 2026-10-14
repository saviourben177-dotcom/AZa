import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";
import { teamPosts } from "@/lib/aza-data";

export const metadata: Metadata = {
  title: "Team Finder — Aza",
  description: "Find founders looking for teammates, or recruit for your own idea.",
};

export default function TeamFinderPage() {
  return (
    <AppShell>
      <BackLink to="/businesses" label="Business" />
      <PageHeader
        title="Team Finder"
        sub="Teams looking for people like you"
        action={
          <Link href="/businesses/team-finder/my-requests" className={btn.secondary}>
            My requests
          </Link>
        }
      />
      <div className="grid gap-3 md:grid-cols-2">
        {teamPosts.map((t) => (
          <Link
            key={t.id}
            href={`/businesses/team-finder/${t.id}`}
            className="card-lift flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-border-strong"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-primary-strong">
              Needs {t.need}
            </p>
            <h3 className="text-base font-semibold text-foreground">{t.name}</h3>
            <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
              <Tag>{t.where}</Tag>
              <Tag>{t.commitment}</Tag>
              <Tag icon={<Users className="size-3.5" />}>{t.members}</Tag>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
