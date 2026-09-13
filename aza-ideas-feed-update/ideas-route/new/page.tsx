import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import NewIdeaForm from "@/components/growth/new-idea-form";

export default async function NewIdeaPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team } = await searchParams;
  const fromTeamFinder = team === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/growth/ideas/new${fromTeamFinder ? "?team=1" : ""}`);

  const backHref = fromTeamFinder ? "/businesses/team-finder" : "/growth/ideas";

  return (
    <div className="px-5 pt-7">
      <div className="flex items-center gap-3">
        <Link href={backHref} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[19px] font-bold text-ink">{fromTeamFinder ? "Post a Team Project" : "Add Idea"}</h1>
      </div>

      <div className="mt-7 flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-aza-light to-aza-light/40 shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_2px_6px_-2px_rgb(var(--accent)/0.35)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_2px_6px_-2px_rgb(var(--accent)/0.45)]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6h5.4c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" stroke="rgb(var(--accent))" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </div>
        {fromTeamFinder ? (
          <>
            <p className="mt-3 font-display text-[16px] font-bold text-ink">Building something?</p>
            <p className="text-[12.5px] text-ink/55">Post it here and find collaborators to join you.</p>
          </>
        ) : (
          <>
            <p className="mt-3 font-display text-[16px] font-bold text-ink">Got an idea?</p>
            <p className="text-[12.5px] text-ink/55">Share it with the community.</p>
          </>
        )}
      </div>

      <div className="mt-6">
        <NewIdeaForm defaultLookingForCollaborators={fromTeamFinder} />
      </div>
    </div>
  );
}
