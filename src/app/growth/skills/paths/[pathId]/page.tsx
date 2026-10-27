import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, Flame, Lock, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { SkillCheckpoint, SkillPath, UserCheckpointProgress, UserSkillPath } from "@/lib/types";
import { getSkillPathIcon } from "@/lib/skill-path-visuals";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn, Progress } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";
import EnrollPanel from "./enroll-panel";
import LearningStylePicker from "./learning-style-picker";

export const dynamic = "force-dynamic";

export default async function SkillPathDetailPage({ params }: { params: Promise<{ pathId: string }> }) {
  const { pathId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: path } = await supabase.from("skill_paths").select("*").eq("id", pathId).single();
  if (!path) notFound();

  const { data: checkpoints } = await supabase
    .from("skill_checkpoints")
    .select("*")
    .eq("path_id", pathId)
    .order("order");

  const [{ data: enrollment }, { data: progressRows }] = await Promise.all([
    user
      ? supabase.from("user_skill_paths").select("*").eq("user_id", user.id).eq("path_id", pathId).maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase.from("user_checkpoint_progress").select("*").eq("user_id", user.id).eq("path_id", pathId)
      : Promise.resolve({ data: [] }),
  ]);

  const typedPath = path as SkillPath;
  const typedCheckpoints = (checkpoints ?? []) as SkillCheckpoint[];
  const progressByCheckpoint = new Map(
    ((progressRows ?? []) as UserCheckpointProgress[]).map((p) => [p.checkpoint_id, p])
  );
  const Icon = getSkillPathIcon(typedPath.cover_icon);
  const isEnrolled = Boolean(enrollment);
  const typedEnrollment = enrollment as UserSkillPath | null;
  const completedCount = Array.from(progressByCheckpoint.values()).filter((p) => p.status === "completed").length;
  const percent = typedCheckpoints.length > 0 ? Math.round((completedCount / typedCheckpoints.length) * 100) : 0;

  return (
    <AppShell>
      <BackLink to="/growth/skills/paths" label="Skill Paths" />

      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-md border emboss-primary">
          <Icon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <PageHeader title={typedPath.title} sub={typedPath.summary ?? undefined} />
        </div>
      </div>

      {typedPath.tier === "premium" && !isEnrolled && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" />
          This is a premium path. Purchasing isn&apos;t available yet — check back soon.
        </div>
      )}

      {!user ? (
        <Link href={`/login?next=/growth/skills/paths/${pathId}`} className={`${btn.primary} mb-6 w-full`}>
          Log in to start this path
        </Link>
      ) : !isEnrolled ? (
        <EnrollPanel pathId={pathId} />
      ) : (
        <>
          <div className="mb-6 rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {completedCount} / {typedCheckpoints.length} checkpoints
              </span>
              {typedEnrollment && typedEnrollment.current_streak_days > 0 && (
                <span className="flex items-center gap-1 text-sm font-bold text-urgent">
                  <Flame className="size-4" />
                  {typedEnrollment.current_streak_days}-day streak
                </span>
              )}
            </div>
            <Progress value={percent} />
          </div>

          {typedEnrollment && (
            <LearningStylePicker pathId={pathId} currentStyle={typedEnrollment.learning_style} />
          )}

          {typedEnrollment?.status === "completed" && (
            <RatingsCard enrollment={typedEnrollment} />
          )}
        </>
      )}

      {typedPath.description && (
        <p className="mb-6 text-sm text-muted-foreground">{typedPath.description}</p>
      )}

      <section>
        <h2 className="mb-3 text-lg font-display font-bold text-foreground">Checkpoints</h2>
        <ol className="space-y-2">
          {typedCheckpoints.map((checkpoint, idx) => {
            const progress = progressByCheckpoint.get(checkpoint.id);
            const status = progress?.status ?? (isEnrolled ? "locked" : "locked");
            return (
              <CheckpointRow
                key={checkpoint.id}
                checkpoint={checkpoint}
                status={status}
                number={idx + 1}
                pathId={pathId}
                clickable={isEnrolled && status !== "locked"}
              />
            );
          })}
        </ol>
      </section>
    </AppShell>
  );
}

function RatingsCard({ enrollment }: { enrollment: UserSkillPath }) {
  return (
    <div className="mb-6 rounded-lg border bg-primary-soft p-4">
      <p className="mb-3 font-display font-bold text-primary-strong">Path complete! 🎉</p>
      <div className="grid grid-cols-3 gap-3 text-center">
        <RatingStat label="Overall" value={enrollment.rating_overall} />
        <RatingStat label="Speed" value={enrollment.rating_speed} />
        <RatingStat label="Consistency" value={enrollment.rating_consistency} />
      </div>
    </div>
  );
}

function RatingStat({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-0.5">
        <Star className="size-4 fill-primary text-primary" />
        <span className="font-display text-lg font-extrabold">{value ?? "—"}</span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function CheckpointRow({
  checkpoint,
  status,
  number,
  pathId,
  clickable,
}: {
  checkpoint: SkillCheckpoint;
  status: string;
  number: number;
  pathId: string;
  clickable: boolean;
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
      <span className="grid size-8 shrink-0 place-items-center rounded-full border text-sm font-bold">
        {status === "completed" ? (
          <CheckCircle2 className="size-5 text-primary" />
        ) : status === "locked" ? (
          <Lock className="size-4 text-muted-foreground" />
        ) : (
          <Circle className="size-5 text-muted-foreground" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate font-semibold ${status === "locked" ? "text-muted-foreground" : "text-foreground"}`}>
          {number}. {checkpoint.title}
        </p>
        {checkpoint.is_final && <Tag tone="primary">Final — produces your portfolio piece</Tag>}
      </div>
    </div>
  );

  if (!clickable) return <li>{content}</li>;
  return (
    <li>
      <Link href={`/growth/skills/paths/${pathId}/checkpoints/${checkpoint.id}`}>{content}</Link>
    </li>
  );
}
