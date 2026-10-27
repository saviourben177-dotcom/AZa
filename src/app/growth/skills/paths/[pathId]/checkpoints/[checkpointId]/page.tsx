import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { CheckpointSubmission, LearningStyle, SkillCheckpoint, SkillPath } from "@/lib/types";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";
import SubmissionForm from "./submission-form";

export const dynamic = "force-dynamic";

export default async function CheckpointPage({
  params,
}: {
  params: Promise<{ pathId: string; checkpointId: string }>;
}) {
  const { pathId, checkpointId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/growth/skills/paths/${pathId}/checkpoints/${checkpointId}`);

  const [{ data: checkpoint }, { data: path }, { data: progress }, { data: enrollment }, { data: pastSubmissions }] =
    await Promise.all([
      supabase.from("skill_checkpoints").select("*").eq("id", checkpointId).single(),
      supabase.from("skill_paths").select("*").eq("id", pathId).single(),
      supabase
        .from("user_checkpoint_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("checkpoint_id", checkpointId)
        .maybeSingle(),
      supabase.from("user_skill_paths").select("learning_style").eq("user_id", user.id).eq("path_id", pathId).maybeSingle(),
      supabase
        .from("checkpoint_submissions")
        .select("*")
        .eq("user_id", user.id)
        .eq("checkpoint_id", checkpointId)
        .order("created_at", { ascending: false }),
    ]);

  if (!checkpoint || !path) notFound();
  if (!progress || progress.status === "locked") {
    redirect(`/growth/skills/paths/${pathId}`);
  }

  const typedCheckpoint = checkpoint as SkillCheckpoint;
  const typedPath = path as SkillPath;
  const style = (enrollment?.learning_style as LearningStyle | null) ?? "focused";
  const body = typedCheckpoint.content_by_style?.[style] ?? typedCheckpoint.content_by_style?.focused ?? typedCheckpoint.description;
  const latestPassed = (pastSubmissions as CheckpointSubmission[] | null)?.find((s) => s.status === "passed");
  const alreadyCompleted = progress.status === "completed";

  return (
    <AppShell>
      <BackLink to={`/growth/skills/paths/${pathId}`} label={typedPath.title} />
      <PageHeader title={typedCheckpoint.title} />

      {typedCheckpoint.learning_points?.length > 0 && (
        <section className="mb-6 rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="mb-2 text-sm font-semibold text-foreground">What you&apos;ll learn</p>
          <ul className="space-y-1.5">
            {typedCheckpoint.learning_points.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                {alreadyCompleted ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                )}
                {point}
              </li>
            ))}
          </ul>
        </section>
      )}

      {body && (
        <section className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <Tag tone="info">
              {style === "entertaining" ? "Entertaining" : style === "practical" ? "Practical" : "Focused"} style
            </Tag>
          </div>
          <div className="whitespace-pre-wrap rounded-lg border bg-card p-4 text-sm leading-relaxed text-foreground">
            {body}
          </div>
        </section>
      )}

      {typedCheckpoint.requires_submission && (
        <SubmissionForm
          checkpointId={checkpointId}
          pathId={pathId}
          isFinal={typedCheckpoint.is_final}
          outputKind={typedPath.output_kind}
          alreadyPassed={Boolean(latestPassed)}
          latestFeedback={latestPassed ?? (pastSubmissions as CheckpointSubmission[] | null)?.[0] ?? null}
        />
      )}
    </AppShell>
  );
}
