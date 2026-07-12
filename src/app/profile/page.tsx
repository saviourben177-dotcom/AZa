import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ReplayGuideRow from "@/components/app-guide/replay-guide-row";
import OpportunityCard from "@/components/opportunity-card";
import SignOutButton from "@/components/sign-out-button";
import ThemeToggle from "@/components/theme-toggle";
import type { Opportunity } from "@/lib/types";

export const dynamic = "force-dynamic";

const PROFILE_FIELDS = [
  "full_name", "age", "status", "field_of_interest", "highest_qualification",
  "skilled_or_unskilled", "region", "avatar_url",
] as const;

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="px-4 pt-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-aza-light text-3xl shadow-card">
          👋
        </div>
        <h1 className="mt-5 text-[21px] font-bold text-ink">You&apos;re not logged in</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-text-secondary">
          Log in to save opportunities and manage your account.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block w-full rounded-pill bg-aza px-6 py-3.5 text-[14.5px] font-semibold text-white shadow-glow-accent"
        >
          Log in
        </Link>
        <div className="mt-10 text-left"><ThemeToggle /></div>
      </div>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const avatarUrl = profile?.avatar_url as string | null | undefined;

  const [{ data: saved }, { count: ideaCount }, { data: cvProfile }] = await Promise.all([
    supabase
      .from("saved_opportunities")
      .select("opportunity_id, saved_at, opportunities(*)")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false }),
    supabase.from("ideas").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("cv_profiles").select("certifications").eq("user_id", user.id).maybeSingle(),
  ]);

  const savedOpportunities = (saved ?? []).map((s) => s.opportunities).filter(Boolean) as unknown as Opportunity[];
  // Real count from cv_profiles.certifications (jsonb array) — not a fabricated number.
  const certificateCount = Array.isArray(cvProfile?.certifications) ? cvProfile.certifications.length : 0;

  const filledFields = profile
    ? PROFILE_FIELDS.filter((f) => {
        const v = (profile as Record<string, unknown>)[f];
        return Array.isArray(v) ? v.length > 0 : !!v;
      }).length
    : 0;
  const completionPct = Math.round((filledFields / PROFILE_FIELDS.length) * 100);

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold leading-tight text-ink">Profile</h1>
        <Link href="/profile/settings" aria-label="Settings" className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-dim text-ink/70">
          <SettingsIcon />
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-aza/30" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-aza-light text-xl font-bold text-aza ring-2 ring-aza/20">
            {(profile?.full_name ?? user.email ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-bold text-ink">{profile?.full_name ?? "Aza user"}</p>
          <p className="truncate text-[12.5px] text-text-secondary">{user.email}</p>
          {profile?.role !== "user" && (
            <span className="mt-1.5 inline-block rounded-pill bg-aza-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-aza">
              {profile?.role}
            </span>
          )}
        </div>
        <Link
          href="/profile/edit"
          className="shrink-0 rounded-pill bg-paper-dim px-3.5 py-1.5 text-[12px] font-semibold text-text-secondary"
        >
          Edit
        </Link>
      </div>

      <div className="mt-4 rounded-card bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] font-semibold text-text-secondary">Profile completion</span>
          <span className="text-[12.5px] font-bold text-aza">{completionPct}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-dim">
          <div className="h-full rounded-full bg-aza" style={{ width: `${completionPct}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 divide-x divide-divider rounded-card bg-surface shadow-card">
        <StatBox label="Saved" value={savedOpportunities.length} />
        {/* "Applications" has no source of truth (same gap flagged on
            Growth Hub) — shown as a dash, not a fabricated count. */}
        <StatBox label="Applications" value={null} />
        <StatBox label="Ideas" value={ideaCount ?? 0} />
        <StatBox label="Certificates" value={certificateCount} />
      </div>

      {(profile?.role === "curator" || profile?.role === "admin") && (
        <Link href="/curator" className="mt-4 block rounded-card bg-elevated px-4 py-3.5 text-center text-[14px] font-semibold text-white shadow-card">
          Open curator dashboard →
        </Link>
      )}

      <section className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-ink">Saved Opportunities</h2>
          {savedOpportunities.length > 3 && (
            <Link href="/profile/saved" className="text-[12.5px] font-semibold text-aza">See all</Link>
          )}
        </div>
        <div className="mt-3 space-y-3">
          {savedOpportunities.length === 0 && (
            <div className="rounded-card bg-surface p-6 text-center shadow-card">
              <p className="text-[13px] leading-relaxed text-text-secondary">
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
        <ProfileLinkRow href="/profile/saved" label="My Saved" />
        <ProfileLinkRow href="/profile/cv" label="CV Studio" />
        <ProfileLinkRow href="/profile/cv#documents" label="Documents" />
        <ProfileLinkRow href="/growth/ideas?filter=mine" label="My Ideas" />
        <ProfileLinkRow href="/businesses/team-finder/my-requests" label="My Join Requests" />
        <ProfileLinkRow href="/businesses/marketplace" label="My Listings" />
        <ProfileLinkRow href="/growth/skills" label="Goals" />
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

function StatBox({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="py-4 text-center">
      <p className={`text-[17px] font-bold tabular ${value === null ? "text-text-tertiary" : "text-ink"}`}>
        {value === null ? "—" : value}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold text-text-tertiary">{label}</p>
    </div>
  );
}

function ProfileLinkRow({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex w-full items-center justify-between rounded-card bg-surface px-4 py-4 shadow-card">
      <span className="text-[14px] font-medium text-ink">{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="m9 6 6 6-6 6" stroke="rgb(var(--text-tertiary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
