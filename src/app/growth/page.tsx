import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import GrowthAskBar from "@/components/growth/growth-ask-bar";
import ProgressRing from "@/components/growth/progress-ring";

export const dynamic = "force-dynamic";

export default async function GrowthHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string | null } | null = null;
  let inProgressSkill: { name: string; progress_percent: number } | null = null;
  let skillCount = 0;
  let ideaCount = 0;

  if (user) {
    const [{ data: profileRow }, { data: skills }, { data: ideas }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      supabase
        .from("user_skills")
        .select("progress_percent, skills(name)")
        .eq("user_id", user.id)
        .order("added_at", { ascending: false }),
      supabase.from("ideas").select("id").eq("user_id", user.id),
    ]);

    profile = profileRow;
    skillCount = skills?.length ?? 0;
    ideaCount = ideas?.length ?? 0;
    const inProgress = (skills ?? []).find((s) => s.progress_percent < 100);
    if (inProgress) {
      inProgressSkill = {
        name: (inProgress.skills as unknown as { name: string })?.name ?? "Skill",
        progress_percent: inProgress.progress_percent,
      };
    }
  }
  const firstName = profile?.full_name?.split(" ")[0] ?? null;

  const { data: recommended } = await supabase
    .from("skill_resources")
    .select("*, skills(name)")
    .order("created_at", { ascending: false })
    .limit(2);

  return (
    <div className="px-4 pt-6">
      <h1 className="text-[22px] font-bold leading-tight text-ink">Growth Hub</h1>

      <div className="mt-4 rounded-lg bg-aza-light p-4">
        <p className="text-[14px] font-semibold text-ink">
          {firstName ? `Hi ${firstName}!` : "Hi there!"} <span aria-hidden="true">👋</span>
        </p>
        <p className="mt-0.5 text-[12.5px] text-ink/70">What do you want to grow today?</p>
        <div className="mt-3">
          <GrowthAskBar />
        </div>
      </div>

      {inProgressSkill && (
        <section className="mt-6">
          <SectionTitle title="Continue learning" href="/growth/skills" />
          <Link
            href="/growth/skills"
            className="mt-3 flex items-center gap-3 rounded-card bg-surface p-4 shadow-card"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card-sm bg-tag-purple-bg text-tag-purple">
              <TargetIcon />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-ink">{inProgressSkill.name}</p>
              <p className="text-[11.5px] font-medium text-text-secondary">
                {inProgressSkill.progress_percent}% complete
              </p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-paper-dim">
                <div className="h-full rounded-full bg-aza" style={{ width: `${inProgressSkill.progress_percent}%` }} />
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-text-tertiary">
              <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-[16px] font-semibold text-ink">Your progress</h2>
        <div className="mt-3 grid grid-cols-3 gap-3 rounded-card bg-surface p-4 shadow-card">
          <ProgressRing value={skillCount} max={Math.max(skillCount, 5)} label="Skills" />
          <ProgressRing value={ideaCount} max={Math.max(ideaCount, 5)} label="Ideas" />
          {/* "Applications" has no source of truth yet — screen-mapping doc
              flags this as needing an implementation decision (new table vs.
              reusing saved_opportunities with a status flag). Rendered as a
              disabled placeholder rather than a fabricated count. */}
          <ProgressRing value={0} max={1} label="Applications" unavailable />
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <HubTile href="/growth/skills" label="My Skills" icon={<TargetIcon />} />
        <HubTile href="/growth/ideas" label="Ideas" icon={<BulbIcon />} />
        <HubTile href="/growth/courses" label="Courses" icon={<BookIcon />} />
        <HubTile href="/profile/cv" label="CV Studio" icon={<GraduationIcon />} />
      </div>

      {recommended && recommended.length > 0 && (
        <section className="mt-7">
          <SectionTitle title="Recommended for you" href="/growth/courses" />
          <div className="mt-3 space-y-2.5">
            {recommended.map((r) => (
              <Link
                key={r.id}
                href="/growth/courses"
                className="flex items-center gap-3.5 rounded-card bg-surface p-3.5 shadow-card"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card-sm bg-aza-light text-[13px] font-bold text-aza">
                  {(r.skills as unknown as { name: string })?.name?.charAt(0) ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-ink">{r.title}</p>
                  <p className="text-[11.5px] font-medium text-text-tertiary">
                    {r.level}
                    {r.duration_hours ? ` · ${r.duration_hours}hrs` : ""}
                    {r.rating ? ` · ★${r.rating}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
      <Link href={href} className="text-[12.5px] font-semibold text-aza">View all</Link>
    </div>
  );
}

function HubTile({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 rounded-card bg-paper-dim py-4">
      <div className="text-aza">{icon}</div>
      <span className="text-[12px] font-medium text-ink/80">{label}</span>
    </Link>
  );
}

function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2V5ZM20 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 0 2-2V5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function TargetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function BulbIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6h5.4c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function GraduationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 4 2 9l10 5 8-4.2V15M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
