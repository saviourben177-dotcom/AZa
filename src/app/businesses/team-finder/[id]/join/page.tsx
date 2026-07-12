import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JoinRequestForm from "@/components/team-finder/join-request-form";

export const dynamic = "force-dynamic";

export default async function RequestToJoinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/businesses/team-finder/${id}/join`);

  const { data: idea, error } = await supabase
    .from("ideas")
    .select("id, title, user_id, idea_roles(*)")
    .eq("id", id)
    .single();

  if (error || !idea) notFound();

  const { data: owner } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", idea.user_id)
    .single();

  const roles = (idea.idea_roles ?? []) as {
    id: string;
    role_name: string;
    slots_needed: number;
    slots_filled: number;
  }[];

  if (roles.length === 0) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="mt-10 text-[13.5px] text-text-secondary">
          This project has no open roles right now.
        </p>
        <Link href={`/businesses/team-finder/${id}`} className="mt-4 inline-block text-[13px] font-semibold text-aza">
          Back to project
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <Link
        href={`/businesses/team-finder/${id}`}
        aria-label="Back"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-surface shadow-card text-ink/60 shadow-card"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </Link>

      <div className="mt-5 flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-aza-light shadow-card">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="8" r="3" stroke="rgb(var(--accent))" strokeWidth="1.7" />
            <circle cx="17" cy="9" r="2.3" stroke="rgb(var(--accent))" strokeWidth="1.7" />
            <path d="M3 20c0-3 2.5-5.5 6-5.5s6 2.5 6 5.5M15 20c0-2.2-1-4-2.5-5.1a5.2 5.2 0 0 1 8 4.3" stroke="rgb(var(--accent))" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="mt-4 text-[20px] font-semibold text-ink">Request to Join</h1>
        <p className="mt-1 text-[16px] font-semibold text-ink">{idea.title}</p>
        <p className="text-[12.5px] text-text-secondary">by {owner?.full_name ?? "Aza user"}</p>
        <p className="mt-3 max-w-[280px] text-[12.5px] leading-relaxed text-text-secondary">
          Let the project owner know why you&apos;re a great fit for this project.
        </p>
      </div>

      <JoinRequestForm ideaId={id} roles={roles} />
    </div>
  );
}
