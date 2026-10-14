import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn } from "@/components/aza/kit";
import { AuthorLine, Tag } from "@/components/aza/ui";
import { teamPosts } from "@/lib/aza-data";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = teamPosts.find((x) => x.id === id);
  if (!t) notFound();

  return (
    <AppShell>
      <BackLink to="/businesses/team-finder" label="Team Finder" />
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{t.name}</h1>
        <div className="my-4">
          <AuthorLine id={t.owner} hoursAgo={30} op />
        </div>
        <div className="mb-6 flex flex-wrap gap-1.5">
          <Tag>{t.where}</Tag>
          <Tag>{t.commitment}</Tag>
          <Tag tone="primary">{t.equity}</Tag>
        </div>
        <h2 className="mb-2 text-lg font-display font-bold text-foreground">Open roles</h2>
        <ul className="mb-6 divide-y rounded-lg border bg-card shadow-[var(--shadow-card)]">
          {t.roles.map((r) => (
            <li key={r} className="flex items-center justify-between p-4">
              <span className="font-medium text-foreground">{r}</span>
              <Link href={`/businesses/team-finder/${t.id}/join`} className={btn.primary}>
                Apply
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
