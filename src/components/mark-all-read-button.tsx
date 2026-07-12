"use client";

import { useTransition } from "react";
import { markAllNotificationsRead } from "@/lib/actions/notifications";

export default function MarkAllReadButton({ hasUnread }: { hasUnread: boolean }) {
  const [isPending, startTransition] = useTransition();

  if (!hasUnread) return null;

  return (
    <button
      onClick={() => startTransition(() => markAllNotificationsRead())}
      disabled={isPending}
      className="text-[12.5px] font-bold text-aza disabled:opacity-50"
    >
      Mark all read
    </button>
  );
}
