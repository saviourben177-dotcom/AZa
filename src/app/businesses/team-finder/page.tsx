import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/types";

export const dynamic = "force-dynamic";

const ROLE_FILTERS = ["All", "Developer", "Designer", "Marketing", "AI/ML", "Finance"];

export default async function TeamFinderHomePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const { role, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("ideas")
    .select("*, idea_roles(*), join_requests(id)")
    .eq("looking_for_collaborators", true)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("title", `%${q}%`);

  const { data: ideasRaw } = await query.limit(50);

  let ideas = ideasRaw ?? [];
  if (role && role !== "All") {
    ideas = ideas.filter((idea) =>
      (idea.idea_roles ?? []).some((r: { role_name: string }) =>
        r.role_name.toLowerCase().includes(role.toLowerCase())
      )
    );
  }

  return (
    <div className="px-5 pt-7 pb-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-aza-light">
          <TeamIcon />
        </div>
        <h1 className="font-display text-[19px] font-bold text-ink">Team Finder</h1>
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink/50">
        Find people. Build together. Grow your ideas.
      </p>

      <form className="mt-5 flex items-center gap-2.5 rounded-card-sm border border-line-strong bg-surface px-4 py-3 shadow-card">
        <SearchIcon />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search projects, skills or keywords..."
          className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink placeholder:text-ink/35 focus:outline-none"
        />
      </form>

      <div className="mt-4 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ROLE_FILTERS.map((r) => {
          const active = (role ?? "All") === r;
          return (
            <Link
              key={r}
              href={r === "All" ? "/businesses/team-finder" : `/businesses/team-finder?role=${encodeURIComponent(r)}`}
              className={`shrink-0 rounded-pill border px-4 py-2 text-[12.5px] font-bold transition-colors ${
                active
                  ? "border-aza bg-aza text-white shadow-glow-accent"
                  : "border-line-strong bg-surface text-ink/60"
              }`}
            >
              {r}
            </Link>
          );
        })}
      </div>

      <div className="mt-5 space-y-3">
        {ideas.length === 0 && (
          <div className="rounded-card border border-line-strong bg-surface p-8 text-center shadow-card">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-aza-light">
              <TeamIcon />
            </div>
            <p className="text-[13px] text-ink/55">
              No open projects match yet — check back soon or post your own idea.
            </p>
          </div>
        )}

        {ideas.map((idea) => {
          const roles = (idea.idea_roles ?? []) as { id: string; role_name: string; slots_needed: number; slots_filled: number }[];
          const requestCount = (idea.join_requests ?? []).length;
          const openRoles = roles.filter((r) => r.slots_filled < r.slots_needed);

          return (
            <Link
              key={idea.id}
              href={`/businesses/team-finder/${idea.id}`}
              className="block rounded-card-sm border border-line-strong bg-surface p-4 shadow-card transition-transform active:scale-[0.98]"
            >
              <div className="flex gap-3.5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-aza to-aza-dark shadow-glow-accent">
                  <span className="font-display text-[19px] font-bold text-white">
                    {idea.title.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[14px] font-bold text-ink">{idea.title}</p>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-ink/55">
                    {idea.description}
                  </p>
                </div>
              </div>

              {openRoles.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-ink/40">Needs:</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {openRoles.slice(0, 3).map((r) => (
                      <span
                        key={r.id}
                        className="rounded-lg bg-aza-light px-2.5 py-1 text-[11px] font-bold text-aza"
                      >
                        {r.role_name} ({r.slots_needed - r.slots_filled})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center gap-3 border-t border-line pt-2.5 text-[11px] font-medium text-ink/45">
                <span className="rounded-md bg-paper-dim px-2 py-0.5 font-bold uppercase tracking-wide text-ink/50">
                  {idea.stage}
                </span>
                <span className="flex items-center gap-1">
                  <PeopleIcon /> {requestCount}
                </span>
                <span className="flex items-center gap-1">
                  <HeartIcon /> {idea.upvotes_count}
                </span>
                <span className="ml-auto">{relativeTime(idea.created_at)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function TeamIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke="rgb(var(--accent))" strokeWidth="1.6" />
      <circle cx="17" cy="9" r="2.4" stroke="rgb(var(--accent))" strokeWidth="1.6" />
      <path d="M3 20c0-3 2.5-5.5 6-5.5s6 2.5 6 5.5M15 20c0-2.2-1-4-2.5-5.1a5.2 5.2 0 0 1 8 4.3" stroke="rgb(var(--accent))" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink/35">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M12 20s-7-4.4-9.4-9C1 8 2.6 4.8 6 4.2c2-.4 3.8.6 6 3 2.2-2.4 4-3.4 6-3 3.4.6 5 3.8 3.4 6.8C19 15.6 12 20 12 20Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
