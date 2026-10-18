import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
      <div className="flex items-center gap-3 border-b bg-background px-4 pb-4 pt-[calc(env(safe-area-inset-top)+16px)] md:px-5">
        <Link
          href={`/u/${otherUserId}`}
          aria-label="Back to profile"
          className="grid size-9 shrink-0 place-items-center rounded-full border text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
        </Link>
        {otherProfile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={otherProfile.avatar_url}
            alt={otherProfile.full_name ?? "Profile"}
            className="size-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-sm font-bold text-primary-strong">
            {(otherProfile?.full_name ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <Link href={`/u/${otherUserId}`} className="min-w-0 hover:underline">
          <p className="truncate text-sm font-bold text-foreground">
            {otherProfile?.full_name ?? "Aza user"}
          </p>
        </Link>
      </div>

      <MessageThread
        messages={messages ?? []}
        currentUserId={user.id}
        onSend={sendDirectMessage.bind(null, conversationId)}
      />
    </div>
  );
}
