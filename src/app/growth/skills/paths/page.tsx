import Link from "next/link";
import { Flame, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { SkillPath, UserSkillPath } from "@/lib/types";
import { getSkillPathIcon } from "@/lib/skill-path-visuals";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn, Empty, Progress } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";

export const dynamic = "force-dynamic";

export default async function SkillPathsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: paths }, enrollments, checkpointProgress] = await Promise.all([
    supabase.from("skill_paths").select("*").eq("is_published", true).order("sort_order"),
    user
      ? supabase.from("user_skill_paths").select("*").eq("user_id", user.id)
      : Promise.resolve({ data: [] as UserSkillPath[] }),
    user
      ? supabase.from("user_checkpoint_progress").select("path_id, status").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { path_id: string; status: string }[] }),
  ]);

  const enrolledByPath = new Map(
    (enrollments.data ?? []).map((e) => [e.path_id, e as unknown as UserSkillPath])
  );
  const allPaths = (paths ?? []) as SkillPath[];
  const inProgress = allPaths.filter((p) => enrolledByPath.get(p.id)?.status === "in_progress");
  const notStarted = allPaths.filter((p) => !enrolledByPath.has(p.id));
  const featured = allPaths[0];

  // Percent of this user's checkpoints (across all statuses they've been
  // seeded with) that are completed, per path — real progress, not a guess.
  const checkpointStatsByPath = new Map<string, { done: number; total: number }>();
  (checkpointProgress.data ?? []).forEach((row) => {
    const stats = checkpointStatsByPath.get(row.path_id) ?? { done: 0, total: 0 };
    stats.total += 1;
    if (row.status === "completed") stats.done += 1;
    checkpointStatsByPath.set(row.path_id, stats);
  });
  const percentByPath = new Map<string, number>();
  checkpointStatsByPath.forEach((stats, pathId) => {
    percentByPath.set(pathId, stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0);
  });

  return (
    <AppShell>
      <BackLink to="/growth/skills" label="Skills" />
      <PageHeader title="Skill Paths" sub="Guided, hands-on paths with real feedback and a real result." />

      {!user && (
        <div className="mb-6 rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            <Link href="/login?next=/growth/skills/paths" className="font-semibold text-primary-strong">
              Log in
            </Link>{" "}
            to track progress, submit checkpoints, and build your portfolio.
          </p>
        </div>
      )}

      {inProgress.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-display font-bold text-foreground">Continue where you left off</h2>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {inProgress.map((path) => (
              <PathCard
                key={path.id}
                path={path}
                enrollment={enrolledByPath.get(path.id)}
                percentComplete={percentByPath.get(path.id) ?? 0}
              />
            ))}
          </ul>
        </section>
      )}

      {featured && !enrolledByPath.has(featured.id) && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-display font-bold text-foreground">Featured</h2>
          <FeaturedCard path={featured} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-display font-bold text-foreground">All paths</h2>
        {notStarted.length === 0 && inProgress.length === 0 ? (
          <Empty title="No paths published yet" sub="Check back soon for new guided skill paths." />
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {notStarted.map((path) => (
              <PathCard
                key={path.id}
                path={path}
                enrollment={enrolledByPath.get(path.id)}
                percentComplete={percentByPath.get(path.id) ?? 0}
              />
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

function FeaturedCard({ path }: { path: SkillPath }) {
  const Icon = getSkillPathIcon(path.cover_icon);
  return (
    <Link
      href={`/growth/skills/paths/${path.id}`}
      className="card-lift block rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="grid size-12 place-items-center rounded-md border emboss-primary">
          <Icon className="size-6" />
        </span>
        {path.tier === "premium" && (
          <Tag icon={<Lock className="size-3.5" />} tone="info">
            Premium
          </Tag>
        )}
      </div>
      <h3 className="font-display text-xl font-bold text-foreground">{path.title}</h3>
      {path.summary && <p className="mt-1 text-sm text-muted-foreground">{path.summary}</p>}
      <div className="mt-4 flex items-center gap-2">
        <span className={btn.primary}>Start path</span>
        {path.estimated_weeks && (
          <span className="text-xs text-muted-foreground">~{path.estimated_weeks} weeks</span>
        )}
      </div>
    </Link>
  );
}

function PathCard({
  path,
  enrollment,
  percentComplete,
}: {
  path: SkillPath;
  enrollment?: UserSkillPath;
  percentComplete: number;
}) {
  const Icon = getSkillPathIcon(path.cover_icon);
  return (
    <li>
      <Link
        href={`/growth/skills/paths/${path.id}`}
        className="card-lift flex gap-3 rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-md border emboss-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="min-w-0 truncate font-semibold text-foreground">{path.title}</span>
            {path.tier === "premium" && <Lock className="size-3.5 shrink-0 text-muted-foreground" />}
          </div>
          {path.summary && <p className="mt-0.5 min-w-0 truncate text-sm text-muted-foreground">{path.summary}</p>}
          {enrollment && enrollment.status === "in_progress" && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1">
                <Progress value={percentComplete} />
              </div>
              {enrollment.current_streak_days > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-urgent">
                  <Flame className="size-3.5" />
                  {enrollment.current_streak_days}
                </span>
              )}
            </div>
          )}
          {enrollment?.status === "completed" && (
            <div className="mt-2">
              <Tag tone="primary">Completed</Tag>
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}
