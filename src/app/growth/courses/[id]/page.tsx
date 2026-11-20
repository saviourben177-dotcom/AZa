import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink } from "@/components/aza/kit";
import CourseDetailClient from "./course-detail-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("title, summary").eq("id", id).maybeSingle();
  if (!data) return { title: "Course — Aza" };
  return { title: `${data.title} — Aza`, description: data.summary ?? "Course on Aza" };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (!course) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let progress: { is_unlocked: boolean; progress_percent: number | null; completed_at: string | null } | null = null;
  let coinBalance = 0;

  if (user) {
    const [{ data: progressRow }, { data: coinRow }] = await Promise.all([
      supabase
        .from("course_progress")
        .select("is_unlocked, progress_percent, completed_at")
        .eq("user_id", user.id)
        .eq("course_id", course.id)
        .maybeSingle(),
      supabase.from("user_coins").select("balance").eq("user_id", user.id).maybeSingle(),
    ]);
    progress = progressRow;
    coinBalance = coinRow?.balance ?? 0;
  }

  return (
    <AppShell>
      <BackLink to="/growth/courses" label="Courses" />
      <CourseDetailClient
        course={course}
        isAuthed={!!user}
        initialIsUnlocked={!course.is_coin_gated || progress?.is_unlocked === true}
        initialCoinBalance={coinBalance}
        initialProgressPercent={progress?.progress_percent ?? null}
        initialIsCompleted={!!progress?.completed_at}
      />
    </AppShell>
  );
}
