import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/types";
import { Users, Search, User, Heart } from "lucide-react";

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
      <div className="flex items-center gap-3">
        <Link href="/businesses" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[19px] font-bold text-ink">Team Finder</h1>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-aza-light to-aza-light/40 shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_2px_6px_-2px_rgb(var(--accent)/0.35)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_2px_6px_-2px_rgb(var(--accent)/0.45)]">
            <Users size={16} strokeWidth={1.8} className="text-aza" />
          </div>
        </div>
        <Link href="/growth/ideas/new?team=1" className="rounded-pill bg-aza px-4 py-2 text-[12.5px] font-bold text-white shadow-glow-accent">
          + Post
        </Link>
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink/50">
        Find people. Build together. Grow your ideas.
      </p>

      <form className="mt-5 flex items-center gap-2.5 rounded-card-sm border border-line-strong bg-surface px-4 py-3 shadow-card">
        <Search size={16} strokeWidth={1.8} className="shrink-0 text-ink/35" />
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
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-aza-light to-aza-light/40 shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_2px_6px_-2px_rgb(var(--accent)/0.35)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_2px_6px_-2px_rgb(var(--accent)/0.45)]">
              <Users size={22} strokeWidth={1.6} className="text-aza" />
            </div>
            <p className="text-[13px] text-ink/55">
              No open projects match yet — check back soon or{" "}
              <Link href="/growth/ideas/new?team=1" className="font-bold text-aza underline">
                post your own idea
              </Link>
              .
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
                  <User size={13} strokeWidth={1.7} /> {requestCount}
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={13} strokeWidth={1.6} /> {idea.upvotes_count}
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

