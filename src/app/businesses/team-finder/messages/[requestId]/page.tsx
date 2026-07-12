import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MessageThread from "@/components/team-finder/message-thread";

export const dynamic = "force-dynamic";

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/businesses/team-finder/messages/${requestId}`);

  const { data: request, error } = await supabase
    .from("join_requests")
    .select("id, idea_id, requester_id, status, ideas(title, user_id)")
    .eq("id", requestId)
    .single();

  if (error || !request) notFound();

  const idea = request.ideas as unknown as { title: string; user_id: string } | null;
  const isRequester = user.id === request.requester_id;
  const isOwner = user.id === idea?.user_id;

  if (!isRequester && !isOwner) notFound();
  if (request.status !== "accepted") notFound();

  const otherUserId = isOwner ? request.requester_id : idea?.user_id;
  const { data: otherProfile } = otherUserId
    ? await supabase.from("profiles").select("full_name, avatar_url").eq("id", otherUserId).single()
    : { data: null };

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("join_request_id", requestId)
    .order("created_at", { ascending: true });

  return (
    <div className="flex h-dvh flex-col">
      <div className="flex items-center gap-3 border-b border-line px-5 pb-4 pt-7">
        <Link href="/businesses/team-finder/my-requests" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface shadow-card text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-aza-light text-[13px] font-semibold text-aza">
          {(otherProfile?.full_name ?? "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold text-ink">{otherProfile?.full_name ?? "Aza user"}</p>
          <p className="truncate text-[11px] font-medium text-text-tertiary">{idea?.title}</p>
        </div>
      </div>

      <MessageThread joinRequestId={requestId} messages={messages ?? []} currentUserId={user.id} />
    </div>
  );
}
