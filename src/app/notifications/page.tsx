import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NotificationRow from "@/components/notification-row";
import MarkAllReadButton from "@/components/mark-all-read-button";
import { AppShell } from "@/components/aza/app-shell";
import { PageHeader } from "@/components/aza/ui";
import { Empty } from "@/components/aza/kit";
import type { AppNotification } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications — Aza",
  description: "Deadlines, replies and team updates.",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/notifications");
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = (notifications ?? []) as AppNotification[];
  const hasUnread = items.some((n) => !n.read_at);

  return (
    <AppShell>
      <PageHeader
        title="Notifications"
        sub="Deadlines, replies and team updates."
        action={<MarkAllReadButton hasUnread={hasUnread} />}
      />

      {items.length === 0 ? (
        <Empty
          title="No notifications yet"
          sub="We'll let you know about new matches, deadlines, and activity here."
        />
      ) : (
        <div className="grid gap-2.5">
          {items.map((n) => (
            <NotificationRow key={n.id} notification={n} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
