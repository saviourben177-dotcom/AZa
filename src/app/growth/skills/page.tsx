import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SKILL_CATEGORY_ORDER, getSkillCategoryLabel } from "@/lib/skill-visuals";
import type { Skill } from "@/lib/types";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn, Empty } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import SkillCard from "./skill-card";
import AddSkillChip from "./add-skill-chip";

export const dynamic = "force-dynamic";

export default async function MySkillsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AppShell>
        <div className="px-5 pt-16 text-center">
          <p className="font-display text-lg font-bold text-foreground">Log in to track your skills</p>
          <Link href="/login?next=/growth/skills" className={`mt-5 inline-block ${btn.primary}`}>
            Log in
          </Link>
        </div>
      </AppShell>
    );
  }

  const [{ data: userSkills }, { data: allSkills }] = await Promise.all([
    supabase
      .from("user_skills")
      .select("skill_id, level, progress_percent, skills(id, name, category)")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false }),
    supabase.from("skills").select("*").order("name"),
  ]);

  const trackedIds = new Set((userSkills ?? []).map((s) => s.skill_id));
  const availableSkills = (allSkills ?? []).filter((s) => !trackedIds.has(s.id)) as Skill[];
  const knownCategories = new Set<string>(SKILL_CATEGORY_ORDER);
  const groupedAvailable = [
    ...SKILL_CATEGORY_ORDER.map((category) => ({
      category: category as string,
      skills: availableSkills.filter((s) => s.category === category),
    })),
    { category: "other", skills: availableSkills.filter((s) => !knownCategories.has(s.category)) },
  ].filter((group) => group.skills.length > 0);

  return (
    <AppShell>
      <BackLink to="/growth" label="Growth" />
      <PageHeader title="Skills" sub="Log progress after each lesson" />

      {(userSkills ?? []).length === 0 ? (
        <Empty title="No skills tracked yet" sub="Add a skill from the list below to start tracking your progress." />
      ) : (
        <ul className="mb-8 grid gap-3 md:grid-cols-2">
          {userSkills!.map((s) => (
            <SkillCard
              key={s.skill_id}
              skillId={s.skill_id}
              name={(s.skills as unknown as Skill).name}
              category={getSkillCategoryLabel((s.skills as unknown as Skill).category)}
              level={s.level}
              progress={s.progress_percent}
            />
          ))}
        </ul>
      )}

      <h2 className="mb-3 text-lg font-display font-bold text-foreground">Add a skill</h2>
      {groupedAvailable.length === 0 ? (
        <p className="text-sm text-muted-foreground">You&apos;re tracking every available skill.</p>
      ) : (
        <div className="space-y-5">
          {groupedAvailable.map(({ category, skills }) => (
            <div key={category}>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                {getSkillCategoryLabel(category)}
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <AddSkillChip key={skill.id} skillId={skill.id} name={skill.name} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
