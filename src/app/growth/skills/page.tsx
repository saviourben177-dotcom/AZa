import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSkillCategoryLabel, SKILL_CATEGORY_ORDER } from "@/lib/skill-visuals";
import type { Skill } from "@/lib/types";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn, Empty } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import SkillCard from "./skill-card";
import AddSkillChip from "./add-skill-chip";
import ResourceList from "./resource-list";

export const dynamic = "force-dynamic";

/**
 * Tag-based skill tracking: add a skill, mark real skill_resources items
 * complete, watch progress_percent move. Separate on purpose from
 * /growth/courses (the newer, API-sourced PDF reading feature) — they
 * share no UI and are different features that happen to both sit under
 * Growth. This replaces the version of this page that also linked out to
 * guided "Skill Paths" (skill_paths/skill_checkpoints), which has been
 * fully retired (see the courses_prep_coins_schema migration) — every
 * reference to that feature is removed here, this page only ever covers
 * the plain skills/skill_resources/user_skills tables, none of which were
 * touched by that retirement.
 */
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

  const [{ data: userSkills }, { data: allSkills }, { data: resources }, { data: savedResources }, { data: completedResources }] =
    await Promise.all([
      supabase
        .from("user_skills")
        .select("skill_id, level, progress_percent, skills(id, name, category)")
        .eq("user_id", user.id)
        .order("added_at", { ascending: false }),
      supabase.from("skills").select("*").order("name"),
      supabase.from("skill_resources").select("*, skills(id, name, category)").order("created_at", { ascending: false }).limit(60),
      supabase.from("saved_resources").select("resource_id").eq("user_id", user.id),
      supabase.from("user_skill_resources").select("resource_id").eq("user_id", user.id),
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

  const savedIds = new Set((savedResources ?? []).map((s) => s.resource_id));
  const completedIds = new Set((completedResources ?? []).map((s) => s.resource_id));

  const trackedSkillIds = new Set((userSkills ?? []).map((s) => s.skill_id));
  const relevantResources = (resources ?? []).filter((r) => trackedSkillIds.has(r.skill_id));

  return (
    <AppShell>
      <BackLink to="/growth" label="Growth" />
      <PageHeader title="Skills" sub="Log progress after each resource" />

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
              categorySlug={(s.skills as unknown as Skill).category}
              level={s.level}
              progress={s.progress_percent}
            />
          ))}
        </ul>
      )}

      {relevantResources.length > 0 ? (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-display font-bold text-foreground">Resources for your skills</h2>
          <ResourceList
            resources={relevantResources}
            savedIds={savedIds}
            completedIds={completedIds}
            isAuthed={!!user}
          />
        </div>
      ) : null}

      <h2 className="mb-3 text-lg font-display font-bold text-foreground">Add a skill</h2>
      {groupedAvailable.length === 0 ? (
        <p className="text-sm text-muted-foreground">You&apos;re tracking every available skill.</p>
      ) : (
        <div className="space-y-5">
          {groupedAvailable.map(({ category, skills }) => (
            <div key={category}>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{getSkillCategoryLabel(category)}</h3>
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
