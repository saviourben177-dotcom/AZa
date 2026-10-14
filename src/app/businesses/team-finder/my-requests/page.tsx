import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/types";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn, Empty } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";

export const dynamic = "force-dynamic";

export default async function MyJoinRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AppShell>
        <div className="px-5 pt-16 text-center">
          <p className="font-display text-lg font-bold text-foreground">Log in to see your requests</p>
          <Link href="/login?next=/businesses/team-finder/my-requests" className={`mt-5 inline-block ${btn.primary}`}>
            Log in
          </Link>
        </div>
      </AppShell>
    );
  }

  const { data } = await supabase
    .from("join_requests")
    .select("id, idea_id, status, message, created_at, responded_at, idea_roles(role_name), ideas(title, user_id)")
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
    <AppShell>
      <BackLink to="/businesses/team-finder" label="Team Finder" />
      <PageHeader title="My Join Requests" sub="Track projects you've asked to join." />

      {requests.length === 0 ? (
        <Empty
          title="No requests yet"
          sub="You haven't requested to join any projects yet."
          action={
            <Link href="/businesses/team-finder" className={btn.primary}>
              Browse Team Finder
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {requests.map((r) => {
            const href =
              r.status === "accepted"
                ? `/businesses/team-finder/messages/${r.id}`
                : `/businesses/team-finder/${r.idea_id}`;
            return (
              <li key={r.id}>
                <Link
                  href={href}
                  className="card-lift block rounded-lg border bg-card p-4 shadow-[var(--shadow-card)] transition-colors hover:border-border-strong"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground">{r.ideas?.title ?? "Project"}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {r.idea_roles?.role_name ?? "Collaborator"}
                      </p>
                    </div>
                    <Tag tone={r.status === "accepted" ? "primary" : r.status === "pending" ? "urgent" : "neutral"}>
                      {r.status}
                    </Tag>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{r.message}</p>
                  <div className="mt-2.5 flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                    <span>Sent {relativeTime(r.created_at)}</span>
                    {r.responded_at && <span>Responded {relativeTime(r.responded_at)}</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
