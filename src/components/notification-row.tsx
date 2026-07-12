"use client";

import Link from "next/link";
import { useTransition } from "react";
import { markNotificationRead } from "@/lib/actions/notifications";
import type { AppNotification, NotificationType } from "@/lib/types";

const TYPE_ICON: Record<NotificationType, string> = {
  join_request_received: "🙋",
  join_request_accepted: "✅",
  join_request_declined: "✉️",
  new_message: "💬",
  deadline_reminder: "⏰",
  opportunity_match: "🎯",
  idea_upvote: "💡",
  system: "🔔",
};

export default function NotificationRow({ notification }: { notification: AppNotification }) {
  const [isPending, startTransition] = useTransition();
  const isUnread = !notification.read_at;

  function handleClick() {
    if (isUnread) {
      startTransition(() => markNotificationRead(notification.id));
    }
  }

  const content = (
    <div
      className={`flex items-start gap-3 rounded-card-sm border p-4 shadow-card transition-opacity ${
        isUnread ? "border-aza/30 bg-aza-light/40" : "border-line-strong bg-surface"
      } ${isPending ? "opacity-60" : ""}`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-dim text-[16px]">
        {TYPE_ICON[notification.type] ?? "🔔"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-ink">{notification.title}</p>
        {notification.body && (
          <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink/60">{notification.body}</p>
        )}
        <p className="mt-1 text-[11px] font-medium text-ink/40">
          {new Date(notification.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
        </p>
      </div>
      {isUnread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-aza" />}
    </div>
  );

  if (notification.link_path) {
    return (
      <Link href={notification.link_path} onClick={handleClick} className="block">
        {content}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className="block w-full text-left" disabled={isPending}>
      {content}
    </button>
  );
}
