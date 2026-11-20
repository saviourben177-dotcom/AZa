import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, Empty } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import CoinBadge from "@/components/aza/coin-badge";
import CategoryPills from "./category-pills";
import CourseCard from "./course-card";
import { suggestGrowthDefaults } from "@/lib/growth-personalization";

export const dynamic = "force-dynamic";

function categoryLabel(c: string): string {
  return c.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: explicitCategory } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Tailoring: when the person hasn't picked a category explicitly (no
  // ?category= in the URL — including never having clicked "All", which
  // sets category=all below), default to the one their onboarding
  // profile suggests. This never hides other categories — it's only
  // which pill starts selected — and a signed-out visitor or a profile
  // with no recognizable field simply sees every category, unfiltered,
  // exactly as before.
  let suggestedCategory: string | null = null;
  if (user && !explicitCategory) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("field_of_interest, industry, business_description, freelance_skill, skilled_or_unskilled")
      .eq("id", user.id)
      .maybeSingle();
    suggestedCategory = suggestGrowthDefaults(profile).category;
  }

  // "all" is a real, explicit choice (the "All" pill) distinct from "no
  // choice made yet" — only the latter gets the suggested default.
  const effectiveCategory = explicitCategory === "all" ? null : explicitCategory ?? suggestedCategory;

  const coursesQuery = supabase
    .from("courses")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(60);

  const { data: courses } = effectiveCategory
    ? await coursesQuery.eq("category", effectiveCategory)
    : await coursesQuery;

  // Category pills are built from the full published set, not the
  // filtered one, so switching categories never hides a pill you'd want
  // to switch back to.
  const { data: allPublished } = await supabase
    .from("courses")
    .select("category")
    .eq("is_published", true);
  const categories = Array.from(new Set((allPublished ?? []).map((c) => c.category))).sort();

  let progressByCourse = new Map<string, { is_unlocked: boolean; progress_percent: number | null; completed_at: string | null }>();
  let coinBalance = 0;

  if (user) {
    const [{ data: progressRows }, { data: coinRow }] = await Promise.all([
      supabase
        .from("course_progress")
        .select("course_id, is_unlocked, progress_percent, completed_at")
        .eq("user_id", user.id),
      supabase.from("user_coins").select("balance").eq("user_id", user.id).maybeSingle(),
    ]);
    progressByCourse = new Map((progressRows ?? []).map((p) => [p.course_id, p]));
    coinBalance = coinRow?.balance ?? 0;
  }

  const isShowingSuggestion = !explicitCategory && !!suggestedCategory;

  return (
    <AppShell>
      <BackLink to="/growth" label="Growth" />
      <PageHeader
        title="Courses"
        sub="Free and paid"
        action={user ? <CoinBadge balance={coinBalance} /> : undefined}
      />

      <CategoryPills categories={categories} active={effectiveCategory} labelFn={categoryLabel} />

      {isShowingSuggestion ? (
        <p className="mb-4 text-xs font-medium text-muted-foreground">
          Showing {categoryLabel(suggestedCategory!)} courses based on your profile — tap &quot;All&quot; to see everything.
        </p>
      ) : null}

      {!courses || courses.length === 0 ? (
        <Empty title="No courses yet in this category" sub="Check back soon — new courses are added regularly." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const progress = progressByCourse.get(course.id);
            const isUnlocked = !course.is_coin_gated || progress?.is_unlocked === true;
            return (
              <CourseCard
                key={course.id}
                course={course}
                isAuthed={!!user}
                isUnlocked={isUnlocked}
                progressPercent={progress?.progress_percent ?? null}
                isCompleted={!!progress?.completed_at}
              />
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
