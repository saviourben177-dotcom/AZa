import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MyJoinRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="mt-10 text-[13.5px] text-text-secondary">Log in to see the requests you&apos;ve sent.</p>
        <Link href="/login?next=/businesses/team-finder/my-requests" className="mt-4 inline-block text-[13px] font-semibold text-aza">
          Log in
        </Link>
      </div>
    );
  }

  const { data } = await supabase
    .from("join_requests")
    .select(
      "id, idea_id, status, message, created_at, responded_at, idea_roles(role_name), ideas(title, user_id)"
    )
    .eq("requester_id", user.id)
    .order("created_at", { ascending: false });

  const requests = (data ?? []) as unknown as {
    id: string;
    idea_id: string;
    status: "pending" | "accepted" | "declined";
    message: string;
    created_at: string;
    responded_at: string | null;
    idea_roles: { role_name: string } | null;
    ideas: { title: string; user_id: string } | null;
  }[];

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center gap-3">
        <Link href="/profile" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface shadow-card text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="text-[19px] font-semibold text-ink">My Join Requests</h1>
      </div>
      <p className="mt-1 pl-12 text-[12.5px] text-text-secondary">Track projects you&apos;ve asked to join.</p>

      <div className="mt-5 space-y-3">
        {requests.length === 0 && (
          <div className="rounded-card bg-surface shadow-card p-8 text-center shadow-card">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-aza-light">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="rgb(var(--accent))" strokeWidth="1.6" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="rgb(var(--accent))" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </div>
            <p className="text-[13px] text-text-secondary">You haven&apos;t requested to join any projects yet.</p>
            <Link href="/businesses/team-finder" className="mt-3 inline-block text-[12.5px] font-semibold text-aza">
              Browse Team Finder →
            </Link>
          </div>
        )}

        {requests.map((r) => {
          const idea = r.ideas;
          const StatusPill = (
            <span
              className={`rounded-pill px-2.5 py-1 text-[10.5px] font-semibold capitalize ${
                r.status === "accepted"
                  ? "bg-aza-light text-aza"
                  : r.status === "declined"
                  ? "bg-paper-dim text-text-tertiary"
                  : "bg-gold-light text-gold"
              }`}
            >
              {r.status}
            </span>
          );

          const content = (
            <div className="rounded-card-sm bg-surface shadow-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-ink">{idea?.title ?? "Project"}</p>
                  <p className="mt-0.5 text-[11.5px] font-semibold text-text-tertiary">
                    {r.idea_roles?.role_name ?? "Collaborator"}
                  </p>
                </div>
                {StatusPill}
              </div>
              <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink/60">{r.message}</p>
              <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2 text-[10.5px] font-medium text-text-tertiary">
                <span>Sent {relativeTime(r.created_at)}</span>
                {r.responded_at && <span>Responded {relativeTime(r.responded_at)}</span>}
              </div>
            </div>
          );

          return r.status === "accepted" ? (
            <Link key={r.id} href={`/businesses/team-finder/messages/${r.id}`} className="block active:scale-[0.98] transition-transform">
              {content}
            </Link>
          ) : (
            <Link key={r.id} href={`/businesses/team-finder/${r.idea_id}`} className="block active:scale-[0.98] transition-transform">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
