import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import GrowthAssistantInput from "@/components/growth/growth-assistant-input";

export const dynamic = "force-dynamic";

export default async function GrowthHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let inProgressSkill: { name: string; progress_percent: number } | null = null;
  let skillCount = 0;
  let ideaCount = 0;
  let applicationCount = 0;

  if (user) {
    const [{ data: skills }, { data: ideas }, { count: appCount }] = await Promise.all([
      supabase
        .from("user_skills")
        .select("progress_percent, skills(name)")
        .eq("user_id", user.id)
        .order("added_at", { ascending: false }),
      supabase.from("ideas").select("id").eq("user_id", user.id),
      supabase
        .from("saved_opportunities")
        .select("opportunity_id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .neq("status", "saved"),
    ]);

    skillCount = skills?.length ?? 0;
    ideaCount = ideas?.length ?? 0;
    applicationCount = appCount ?? 0;
    const inProgress = (skills ?? []).find((s) => s.progress_percent < 100);
    if (inProgress) {
      inProgressSkill = {
        name: (inProgress.skills as unknown as { name: string })?.name ?? "Skill",
        progress_percent: inProgress.progress_percent,
      };
    }
  }

  // a lightweight "recommended for you" pull — most recently added free courses
  const { data: recommended } = await supabase
    .from("skill_resources")
    .select("*, skills(name)")
    .order("created_at", { ascending: false })
    .limit(2);

  return (
    <div className="px-5 pt-7">
      <p className="text-[12px] font-bold uppercase tracking-wide text-aza">Growth Hub</p>
      <h1 className="mt-1 font-display text-[24px] font-bold leading-tight text-ink">Learn. Create. Grow.</h1>

      <GrowthAssistantInput isAuthed={!!user} />

      <div className="mt-6 grid grid-cols-2 gap-3">
        <HubCard
          href="/growth/courses"
          title="Continue Learning"
          subtitle={inProgressSkill ? `${inProgressSkill.name} · ${inProgressSkill.progress_percent}% complete` : "Browse courses to get started"}
          progress={inProgressSkill?.progress_percent}
          icon={<BookIcon />}
        />
        <HubCard
          href="/growth/skills"
          title="My Skills"
          subtitle={skillCount > 0 ? `${skillCount} skill${skillCount === 1 ? "" : "s"} tracked` : "Manage your skills and track progress"}
          icon={<TargetIcon />}
        />
        <HubCard
          href="/growth/ideas"
          title="Ideas"
          subtitle={ideaCount > 0 ? `${ideaCount} idea${ideaCount === 1 ? "" : "s"} shared` : "Explore, create and validate ideas"}
          icon={<BulbIcon />}
        />
        <HubCard
          href="/growth/courses"
          title="Courses"
          subtitle="Explore courses and paths"
          icon={<GraduationIcon />}
        />
      </div>

      {user && (
        <div className="mt-5 grid grid-cols-3 divide-x divide-line rounded-card border border-line-strong bg-surface shadow-card">
          <GrowthStatBox label="Skills" value={skillCount} />
          <GrowthStatBox label="Ideas" value={ideaCount} />
          <GrowthStatBox label="Applications" value={applicationCount} />
        </div>
      )}

      {recommended && recommended.length > 0 && (
        <section className="mt-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[16px] font-bold text-ink">Recommended for you</h2>
            <Link href="/growth/courses" className="text-[12.5px] font-bold text-aza">See all</Link>
          </div>
          <div className="mt-3 space-y-2.5">
            {recommended.map((r) => (
              <div key={r.id} className="flex items-center gap-3.5 rounded-card-sm border border-line-strong bg-surface p-3.5 shadow-card">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-aza-light font-display text-[13px] font-bold text-aza">
                  {(r.skills as unknown as { name: string })?.name?.charAt(0) ?? "?"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold text-ink">{r.title}</p>
                  <p className="text-[11.5px] font-medium text-ink/50">
                    {r.level} {r.duration_hours ? `· ${r.duration_hours}hrs` : ""} {r.rating ? `· ★${r.rating}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function HubCard({
  href, title, subtitle, icon, progress,
}: {
  href: string; title: string; subtitle: string; icon: React.ReactNode; progress?: number;
}) {
  return (
    <Link href={href} className="rounded-card-sm border border-line-strong bg-surface p-4 shadow-card transition-transform active:scale-95">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-aza-light">{icon}</div>
      <p className="mt-3 font-display text-[14px] font-bold text-ink">{title}</p>
      <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-ink/55">{subtitle}</p>
      {progress != null && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-paper-dim">
          <div className="h-full rounded-full bg-aza" style={{ width: `${progress}%` }} />
        </div>
      )}
    </Link>
  );
}

function GrowthStatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="py-3.5 text-center">
      <p className="font-display text-[18px] font-bold text-ink tabular-nums">{value}</p>
      <p className="mt-0.5 text-[10.5px] font-semibold text-ink/50">{label}</p>
    </div>
  );
}

function BookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2V5ZM20 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 0 2-2V5Z" stroke="rgb(var(--accent))" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function TargetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="rgb(var(--accent))" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.5" stroke="rgb(var(--accent))" strokeWidth="1.6" />
    </svg>
  );
}
function BulbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6h5.4c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" stroke="rgb(var(--accent))" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function GraduationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 4 2 9l10 5 8-4.2V15M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" stroke="rgb(var(--accent))" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
