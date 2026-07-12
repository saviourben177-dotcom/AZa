import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RequestRow from "@/components/team-finder/request-row";

export const dynamic = "force-dynamic";

export default async function JoinRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = (tab === "accepted" || tab === "declined") ? tab : "pending";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="mt-10 text-[13.5px] text-text-secondary">Log in to manage join requests.</p>
        <Link href="/login?next=/businesses/team-finder/requests" className="mt-4 inline-block text-[13px] font-semibold text-aza">
          Log in
        </Link>
      </div>
    );
  }

  // Requests for ideas this user owns
  const { data: myIdeas } = await supabase.from("ideas").select("id, title").eq("user_id", user.id);
  const ideaIds = (myIdeas ?? []).map((i) => i.id);
  const ideaTitleMap = new Map((myIdeas ?? []).map((i) => [i.id, i.title]));

  let requests: {
    id: string;
    idea_id: string;
    role_id: string;
    requester_id: string;
    message: string;
    status: "pending" | "accepted" | "declined";
    created_at: string;
    idea_roles: { role_name: string } | null;
    profiles: { full_name: string | null; avatar_url: string | null } | null;
  }[] = [];

  if (ideaIds.length > 0) {
    const { data } = await supabase
      .from("join_requests")
      .select(
        "id, idea_id, role_id, requester_id, message, status, created_at, idea_roles(role_name), profiles!join_requests_requester_id_fkey(full_name, avatar_url)"
      )
      .in("idea_id", ideaIds)
      .eq("status", activeTab)
      .order("created_at", { ascending: false });
    requests = (data ?? []) as unknown as typeof requests;
  }

  const counts = { pending: 0, accepted: 0, declined: 0 };
  if (ideaIds.length > 0) {
    const { data: allStatuses } = await supabase
      .from("join_requests")
      .select("status")
      .in("idea_id", ideaIds);
    for (const r of allStatuses ?? []) {
      counts[r.status as keyof typeof counts]++;
    }
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center gap-3">
        <Link href="/businesses/team-finder" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface shadow-card text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="text-[19px] font-semibold text-ink">Join Requests</h1>
      </div>

      <div className="mt-5 flex gap-2">
        <TabButton label="Pending" count={counts.pending} tab="pending" active={activeTab === "pending"} />
        <TabButton label="Accepted" count={counts.accepted} tab="accepted" active={activeTab === "accepted"} />
        <TabButton label="Declined" count={counts.declined} tab="declined" active={activeTab === "declined"} />
      </div>

      <div className="mt-5 space-y-3">
        {requests.length === 0 && (
          <div className="rounded-card bg-surface shadow-card p-8 text-center shadow-card">
            <p className="text-[13px] text-text-secondary">No {activeTab} requests right now.</p>
          </div>
        )}

        {requests.map((r) => (
          <RequestRow
            key={r.id}
            requestId={r.id}
            ideaId={r.idea_id}
            ideaTitle={ideaTitleMap.get(r.idea_id) ?? "Project"}
            roleName={r.idea_roles?.role_name ?? "Collaborator"}
            requesterName={r.profiles?.full_name ?? "Aza user"}
            avatarUrl={r.profiles?.avatar_url}
            message={r.message}
            status={r.status}
            createdAt={r.created_at}
            isNew={activeTab === "pending"}
          />
        ))}
      </div>
    </div>
  );
}

function TabButton({ label, count, tab, active }: { label: string; count: number; tab: string; active: boolean }) {
  return (
    <Link
      href={`/businesses/team-finder/requests?tab=${tab}`}
      className={`flex items-center gap-1.5 rounded-pill border px-4 py-2 text-[12.5px] font-semibold ${
        active ? "border-aza bg-aza text-white shadow-glow-accent" : "border-line-strong bg-surface text-text-secondary"
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`rounded-full px-1.5 text-[10.5px] ${active ? "bg-white/25" : "bg-paper-dim"}`}>{count}</span>
      )}
    </Link>
  );
}
