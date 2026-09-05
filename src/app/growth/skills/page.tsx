import Link from "next/link";
import { Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AddSkillButton from "@/components/growth/add-skill-button";
import SkillProgressBar from "@/components/growth/skill-progress-bar";
import { SKILL_CATEGORY_ORDER, getSkillCategoryIcon, getSkillCategoryLabel } from "@/lib/skill-visuals";
import type { Skill } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MySkillsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="px-5 pt-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-aza-light to-aza-light/40 text-2xl shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_2px_6px_-2px_rgb(var(--accent)/0.35)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_2px_6px_-2px_rgb(var(--accent)/0.45)]">🎯</div>
        <p className="mt-4 font-display text-[17px] font-bold text-ink">Log in to track your skills</p>
        <Link href="/login?next=/growth/skills" className="mt-5 inline-block w-full rounded-pill bg-aza px-6 py-3.5 text-[14.5px] font-bold text-white shadow-glow-accent">
          Log in
        </Link>
      </div>
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
    // Safety net: any row whose category isn't one of the 6 known values
    // (see NOTE in skill-visuals.ts) still shows up here instead of
    // silently disappearing from "Add a skill".
    {
      category: "other",
      skills: availableSkills.filter((s) => !knownCategories.has(s.category)),
    },
  ].filter((group) => group.skills.length > 0);

  return (
    <div className="px-5 pt-7">
      <div className="flex items-center gap-3">
        <Link href="/growth" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[19px] font-bold text-ink">My Skills</h1>
      </div>

      <section className="mt-6">
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-ink/45">Your Skills</h2>
        <div className="mt-3 space-y-3">
          {(userSkills ?? []).length === 0 && (
            <div className="rounded-card border border-line-strong bg-surface px-6 py-9 text-center shadow-card">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-aza-light to-aza-light/40 shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_2px_6px_-2px_rgb(var(--accent)/0.35)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_2px_6px_-2px_rgb(var(--accent)/0.45)]">
                <Target size={22} strokeWidth={1.8} className="text-aza" />
              </div>
              <p className="font-display text-[14.5px] font-bold text-ink">No skills tracked yet</p>
              <p className="mx-auto mt-1.5 max-w-[220px] text-[12.5px] leading-relaxed text-ink/55">
                Add a skill from the list below to start tracking your progress.
              </p>
            </div>
          )}
          {userSkills?.map((s) => {
            const skill = s.skills as unknown as Skill;
            const CategoryIcon = getSkillCategoryIcon(skill.category);
            return (
              <div key={s.skill_id} className="rounded-card-sm border border-line-strong bg-surface p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aza-light to-aza-light/40 shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_2px_6px_-2px_rgb(var(--accent)/0.35)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_2px_6px_-2px_rgb(var(--accent)/0.45)]">
                    <CategoryIcon size={16} strokeWidth={1.8} className="text-aza" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[14px] font-bold text-ink">{skill.name}</p>
                      <span className="shrink-0 rounded-pill bg-paper-dim px-2.5 py-1 text-[10.5px] font-bold capitalize text-ink/55">{s.level}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-semibold text-ink/40">{getSkillCategoryLabel(skill.category)}</p>
                    <div className="mt-3">
                      <SkillProgressBar skillId={s.skill_id} progress={s.progress_percent} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-ink/45">Add a skill</h2>
        {groupedAvailable.length === 0 ? (
          <p className="mt-3 text-[12px] text-ink/45">You&apos;re tracking every available skill.</p>
        ) : (
          <div className="mt-3 space-y-5">
            {groupedAvailable.map(({ category, skills }) => {
              const CategoryIcon = getSkillCategoryIcon(category);
              return (
                <div key={category}>
                  <div className="flex items-center gap-2">
                    <CategoryIcon size={14} strokeWidth={2} className="text-aza" />
                    <h3 className="text-[11.5px] font-bold text-ink/60">{getSkillCategoryLabel(category)}</h3>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <AddSkillButton key={skill.id} skillId={skill.id} name={skill.name} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
