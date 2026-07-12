import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AddSkillButton from "@/components/growth/add-skill-button";
import SkillProgressBar from "@/components/growth/skill-progress-bar";
import SkillIconTile from "@/components/growth/skill-icon-tile";

export const dynamic = "force-dynamic";

export default async function MySkillsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="px-4 pt-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-aza-light text-2xl shadow-card">🎯</div>
        <p className="mt-4 text-[17px] font-semibold text-ink">Log in to track your skills</p>
        <Link href="/login?next=/growth/skills" className="mt-5 inline-block w-full rounded-pill bg-aza px-6 py-3.5 text-[14.5px] font-semibold text-white shadow-glow-accent">
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
  const availableSkills = (allSkills ?? []).filter((s) => !trackedIds.has(s.id));

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <Link href="/growth" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-dim text-ink/70">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="text-[19px] font-bold text-ink">Skills</h1>
      </div>

      <div className="mt-4 flex rounded-pill bg-paper-dim p-1">
        <span className="flex-1 rounded-pill bg-aza py-2 text-center text-[13px] font-semibold text-white">My Skills</span>
        <Link href="#all-skills" className="flex-1 rounded-pill py-2 text-center text-[13px] font-semibold text-text-secondary">All Skills</Link>
        <Link href="/growth/courses" className="flex-1 rounded-pill py-2 text-center text-[13px] font-semibold text-text-secondary">Resources</Link>
      </div>

      <section className="mt-6 space-y-3">
        {(userSkills ?? []).length === 0 && (
          <div className="rounded-card bg-surface p-6 text-center shadow-card">
            <p className="text-[13px] text-text-secondary">No skills tracked yet — add one below.</p>
          </div>
        )}
        {userSkills?.map((s) => {
          const skill = s.skills as unknown as { id: string; name: string; category: string };
          return (
            <div key={s.skill_id} className="flex items-center gap-3.5 rounded-card bg-surface p-4 shadow-card">
              <SkillIconTile category={skill.category} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-[14.5px] font-semibold text-ink">{skill.name}</p>
                  <span className="shrink-0 pl-2 text-[13px] font-bold text-aza">{s.progress_percent}%</span>
                </div>
                <p className="text-[11.5px] font-medium capitalize text-text-tertiary">{s.level}</p>
                <div className="mt-2">
                  <SkillProgressBar skillId={s.skill_id} progress={s.progress_percent} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section id="all-skills" className="mt-7 scroll-mt-6">
        <h2 className="text-[16px] font-semibold text-ink">Add a skill</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {availableSkills.map((skill) => (
            <AddSkillButton key={skill.id} skillId={skill.id} name={skill.name} />
          ))}
          {availableSkills.length === 0 && (
            <p className="text-[12px] text-text-secondary">You&apos;re tracking every available skill.</p>
          )}
        </div>
      </section>
    </div>
  );
}
