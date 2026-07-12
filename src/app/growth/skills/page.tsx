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
      <div className="px-5 pt-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-aza-light text-2xl shadow-card">🎯</div>
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
  const availableSkills = (allSkills ?? []).filter((s) => !trackedIds.has(s.id));

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
            <div className="rounded-card border border-line-strong bg-surface p-6 text-center shadow-card">
              <p className="text-[13px] text-ink/55">No skills tracked yet — add one below.</p>
            </div>
          )}
          {userSkills?.map((s) => {
            const skill = s.skills as unknown as { id: string; name: string; category: string };
            return (
              <div key={s.skill_id} className="rounded-card-sm border border-line-strong bg-surface p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-bold text-ink">{skill.name}</p>
                  <span className="rounded-pill bg-paper-dim px-2.5 py-1 text-[10.5px] font-bold capitalize text-ink/55">{s.level}</span>
                </div>
                <div className="mt-3">
                  <SkillProgressBar skillId={s.skill_id} progress={s.progress_percent} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-ink/45">Add a skill</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {availableSkills.map((skill) => (
            <AddSkillButton key={skill.id} skillId={skill.id} name={skill.name} />
          ))}
          {availableSkills.length === 0 && <p className="text-[12px] text-ink/45">You&apos;re tracking every available skill.</p>}
        </div>
      </section>
    </div>
  );
}
