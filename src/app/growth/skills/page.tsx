import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AddSkillButton from "@/components/growth/add-skill-button";
import SkillProgressBar from "@/components/growth/skill-progress-bar";

export const dynamic = "force-dynamic";

export default async function MySkillsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="px-4 pt-12 text-center">
        <p className="font-display text-[16px] font-bold text-ink">Log in to track your skills</p>
        <Link href="/login?next=/growth/skills" className="mt-4 inline-block rounded-card bg-aza px-6 py-3 text-[14px] font-bold text-white">
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
        <Link href="/growth" aria-label="Back" className="text-ink/60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[18px] font-extrabold text-ink">My Skills</h1>
      </div>

      <section className="mt-5">
        <h2 className="font-display text-[13px] font-bold text-ink/70">Your Skills</h2>
        <div className="mt-2.5 space-y-2.5">
          {(userSkills ?? []).length === 0 && (
            <p className="text-[13px] text-ink/50">No skills tracked yet — add one below.</p>
          )}
          {userSkills?.map((s) => {
            const skill = s.skills as unknown as { id: string; name: string; category: string };
            return (
              <div key={s.skill_id} className="rounded-card border border-line bg-surface p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-[13.5px] font-bold text-ink">{skill.name}</p>
                  <span className="text-[11px] font-semibold capitalize text-ink/50">{s.level}</span>
                </div>
                <div className="mt-2.5">
                  <SkillProgressBar skillId={s.skill_id} progress={s.progress_percent} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-[13px] font-bold text-ink/70">Add a skill</h2>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {availableSkills.map((skill) => (
            <AddSkillButton key={skill.id} skillId={skill.id} name={skill.name} />
          ))}
          {availableSkills.length === 0 && <p className="text-[12px] text-ink/45">You&apos;re tracking every available skill.</p>}
        </div>
      </section>
    </div>
  );
}
