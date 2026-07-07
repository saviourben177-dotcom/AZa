import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ReplayGuideRow from "@/components/app-guide/replay-guide-row";
import OpportunityCard from "@/components/opportunity-card";
import SignOutButton from "@/components/sign-out-button";
import ThemeToggle from "@/components/theme-toggle";
import type { Opportunity } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="px-5 pt-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-aza-light text-3xl shadow-card">
          👋
        </div>
        <h1 className="mt-5 font-display text-[21px] font-bold text-ink">You&apos;re not logged in</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink/55">
          Log in to save opportunities and manage your account.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block w-full rounded-pill bg-aza px-6 py-3.5 text-[14.5px] font-bold text-white shadow-glow-accent"
        >
          Log in
        </Link>
        <div className="mt-10 text-left"><ThemeToggle /></div>
      </div>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const avatarUrl = profile?.avatar_url as string | null | undefined;

  const [{ data: saved }, { count: ideaCount }, { count: skillCount }] = await Promise.all([
    supabase
      .from("saved_opportunities")
      .select("opportunity_id, saved_at, opportunities(*)")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false }),
    supabase.from("ideas").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("user_skills").select("skill_id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const savedOpportunities = (saved ?? []).map((s) => s.opportunities).filter(Boolean) as unknown as Opportunity[];

  return (
    <div className="px-5 pt-7">
      <p className="text-[12px] font-bold uppercase tracking-wide text-aza">Profile</p>

      <div className="mt-4 flex items-center gap-4 rounded-card border border-line-strong bg-surface p-4 shadow-card">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-aza/30" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-aza-light font-display text-xl font-bold text-aza ring-2 ring-aza/20">
            {(profile?.full_name ?? user.email ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[16px] font-bold text-ink">{profile?.full_name ?? "Aza user"}</p>
          <p className="truncate text-[12.5px] text-ink/50">{user.email}</p>
          {profile?.role !== "user" && (
            <span className="mt-1.5 inline-block rounded-pill bg-aza-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-aza">
              {profile?.role}
            </span>
          )}
        </div>
        <Link
          href="/profile/edit"
          className="shrink-0 rounded-pill border border-line-strong px-3.5 py-1.5 text-[12px] font-bold text-ink/70"
        >
          Edit
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-line rounded-card border border-line-strong bg-surface shadow-card">
        <StatBox label="Saved" value={savedOpportunities.length} />
        <StatBox label="Ideas" value={ideaCount ?? 0} />
        <StatBox label="Skills" value={skillCount ?? 0} />
      </div>

      {(profile?.role === "curator" || profile?.role === "admin") && (
        <Link href="/curator" className="mt-4 block rounded-card bg-ink px-4 py-3.5 text-center text-[14px] font-bold text-paper shadow-card">
          Open curator dashboard →
        </Link>
      )}

      <section className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[16px] font-bold text-ink">Saved Opportunities</h2>
          {savedOpportunities.length > 3 && (
            <Link href="/profile/saved" className="text-[12.5px] font-bold text-aza">See all</Link>
          )}
        </div>
        <div className="mt-3 space-y-4">
          {savedOpportunities.length === 0 && (
            <div className="rounded-card border border-line-strong bg-surface p-6 text-center shadow-card">
              <p className="text-[13px] leading-relaxed text-ink/55">
                Nothing saved yet — tap the bookmark icon on any opportunity.
              </p>
            </div>
          )}
          {savedOpportunities.slice(0, 3).map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} isSaved={true} isAuthed={true} />
          ))}
        </div>
      </section>

      <section className="mt-7 space-y-2.5">
        <ProfileLinkRow href="/profile/cv" label="CV Builder" />
        <ProfileLinkRow href="/growth/ideas?filter=mine" label="My Ideas" />
        <ProfileLinkRow href="/businesses/team-finder/my-requests" label="My Join Requests" />
        <ProfileLinkRow href="/growth/skills" label="My Skills" />
        <ProfileLinkRow href="/businesses/marketplace" label="My Listings" />
      </section>

      <section className="mt-7 space-y-2.5">
        <ThemeToggle />
        <ReplayGuideRow />
        <ProfileLinkRow href="/help" label="Help & Support" />
        <ProfileLinkRow href="/about" label="About Aza" />
        <ProfileLinkRow href="/profile/settings" label="Settings" />
      </section>

      <div className="mt-7"><SignOutButton /></div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="py-4 text-center">
      <p className="font-display text-[19px] font-bold text-ink tabular">{value}</p>
      <p className="mt-0.5 text-[10.5px] font-semibold text-ink/50">{label}</p>
    </div>
  );
}

function ProfileLinkRow({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex w-full items-center justify-between rounded-card-sm border border-line-strong bg-surface px-4 py-4 shadow-card">
      <span className="text-[14px] font-semibold text-ink">{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="m9 6 6 6-6 6" stroke="rgb(var(--ink) / 0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
