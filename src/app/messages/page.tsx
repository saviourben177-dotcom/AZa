import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/aza/app-shell";
import { Empty } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Messages — Aza",
};

export default async function MessagesInboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/messages");

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, user_a_id, user_b_id, created_at")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const list = conversations ?? [];
  const otherIds = list.map((c) => (c.user_a_id === user.id ? c.user_b_id : c.user_a_id));

  const [{ data: profiles }, { data: lastMessages }] = await Promise.all([
    otherIds.length > 0
      ? supabase.from("public_profiles").select("id, full_name, avatar_url").in("id", otherIds)
      : Promise.resolve({ data: [] }),
    list.length > 0
      ? supabase
          .from("messages")
          .select("conversation_id, body, created_at, sender_id")
          .in("conversation_id", list.map((c) => c.id))
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const lastMessageByConversation = new Map<string, { body: string; created_at: string; sender_id: string }>();
  for (const m of lastMessages ?? []) {
    if (!m.conversation_id) continue;
    if (!lastMessageByConversation.has(m.conversation_id)) {
      lastMessageByConversation.set(m.conversation_id, m);
    }
  }

  const rows = list
    .map((c) => {
      const otherId = c.user_a_id === user.id ? c.user_b_id : c.user_a_id;
      const profile = profileById.get(otherId);
      const last = lastMessageByConversation.get(c.id);
      return {
        conversationId: c.id,
        otherId,
        name: profile?.full_name ?? "Aza user",
        avatarUrl: profile?.avatar_url ?? null,
        lastBody: last?.body ?? null,
        lastAt: last?.created_at ?? c.created_at,
        mine: last?.sender_id === user.id,
      };
    })
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

  return (
    <AppShell>
      <PageHeader title="Messages" />
      {rows.length === 0 ? (
        <Empty
          title="No conversations yet"
          sub="Messages you start from someone's profile will show up here."
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border">
          {rows.map((r) => (
            <li key={r.conversationId}>
              <Link
                href={`/messages/${r.conversationId}`}
                className="flex items-center gap-3 p-4 hover:bg-accent"
              >
                {r.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.avatarUrl}
                    alt={r.name}
                    className="size-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-sm font-bold text-primary-strong">
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{r.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {r.lastBody ? `${r.mine ? "You: " : ""}${r.lastBody}` : "No messages yet"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
