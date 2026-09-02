import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Share2, Heart, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function IdeaPostedPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const supabase = await createClient();

  let listedInTeamFinder = false;
  if (id) {
    const { data: idea } = await supabase.from("ideas").select("looking_for_collaborators").eq("id", id).single();
    listedInTeamFinder = !!idea?.looking_for_collaborators;
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col px-5 pt-12 pb-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-aza shadow-glow-accent">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h1 className="mt-4 font-display text-[21px] font-bold text-ink">Idea Posted!</h1>
        <p className="mt-1 text-[12.5px] text-ink/50">Your idea has been posted in Growth Hub.</p>
      </div>

      {listedInTeamFinder && (
        <div className="mt-6 flex items-center gap-3 rounded-card-sm border border-aza/25 bg-aza-light px-4 py-3.5 shadow-card">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-aza/15">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="rgb(var(--accent))" strokeWidth="1.6" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="rgb(var(--accent))" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-aza-dark">Looking for collaborators</p>
            <p className="text-[11.5px] leading-relaxed text-aza-dark/70">
              This idea will also appear in Team Finder so people can find and join your project.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <p className="text-[12px] font-bold uppercase tracking-wide text-ink/40">What&apos;s next?</p>
        <div className="mt-3 space-y-3">
          <NextStep
            icon={<Share2 size={16} strokeWidth={1.7} className="text-aza" />}
            title="Share your idea"
            subtitle="Invite more people to give feedback."
          />
          <NextStep
            icon={<Heart size={16} strokeWidth={1.6} className="text-aza" />}
            title="Engage with your audience"
            subtitle="Reply to comments and build momentum."
          />
          {listedInTeamFinder && (
            <NextStep
              icon={<Users size={16} strokeWidth={1.6} className="text-aza" />}
              title="Find your team"
              subtitle="Collaborators can discover and request to join your project."
            />
          )}
        </div>
      </div>

      <div className="mt-auto space-y-3 pt-8">
        <Link
          href="/growth/ideas"
          className="block rounded-card bg-aza py-3.5 text-center text-[14.5px] font-bold text-white shadow-glow-accent"
        >
          Go to Growth Hub
        </Link>
        {listedInTeamFinder && id && (
          <Link
            href={`/businesses/team-finder/${id}`}
            className="block text-center text-[13px] font-bold text-aza"
          >
            View in Team Finder
          </Link>
        )}
      </div>
    </div>
  );
}

function NextStep({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 rounded-card-sm border border-line-strong bg-surface p-3.5 shadow-card">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-aza-light">{icon}</div>
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink/55">{subtitle}</p>
      </div>
    </div>
  );
}

