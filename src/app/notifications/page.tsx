import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NotificationRow from "@/components/notification-row";
import MarkAllReadButton from "@/components/mark-all-read-button";
import type { AppNotification } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/notifications");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = (notifications ?? []) as AppNotification[];
  const hasUnread = items.some((n) => !n.read_at);

  return (
    <div className="px-5 pt-7">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 className="font-display text-[19px] font-bold text-ink">Notifications</h1>
        </div>
        <MarkAllReadButton hasUnread={hasUnread} />
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-card border border-line-strong bg-surface p-8 text-center shadow-card">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-aza-light text-xl">🔔</div>
          <p className="font-display text-[15px] font-bold text-ink">No notifications yet</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink/55">
            We&apos;ll let you know about new matches, deadlines, and idea activity here.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-2.5">
          {items.map((n) => (
            <NotificationRow key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}
