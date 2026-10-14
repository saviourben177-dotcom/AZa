import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MessageThread from "@/components/team-finder/message-thread";
import { sendDirectMessage } from "@/lib/actions/messages";

export const dynamic = "force-dynamic";

export default async function DirectMessagePage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/messages/${conversationId}`);

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, user_a_id, user_b_id")
    .eq("id", conversationId)
    .single();

  if (!conversation) notFound();
  if (conversation.user_a_id !== user.id && conversation.user_b_id !== user.id) notFound();

  const otherUserId =
    conversation.user_a_id === user.id ? conversation.user_b_id : conversation.user_a_id;

  const { data: otherProfile } = await supabase
    .from("public_profiles")
    .select("full_name, avatar_url")
    .eq("id", otherUserId)
    .maybeSingle();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (
    <div className="flex h-dvh flex-col">
      <div className="flex items-center gap-3 border-b border-line px-5 pb-4 pt-7">
        <Link href={`/u/${otherUserId}`} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-aza-light font-display text-[13px] font-bold text-aza">
          {(otherProfile?.full_name ?? "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-bold text-ink">{otherProfile?.full_name ?? "Aza user"}</p>
        </div>
      </div>

      <MessageThread
        messages={messages ?? []}
        currentUserId={user.id}
        onSend={sendDirectMessage.bind(null, conversationId)}
      />
    </div>
  );
}
