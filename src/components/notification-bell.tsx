"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    let channelCleanup: (() => void) | undefined;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);

      if (isMounted) setUnreadCount(count ?? 0);

      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            if (isMounted) setUnreadCount((c) => c + 1);
          }
        )
        .subscribe();

      channelCleanup = () => {
        supabase.removeChannel(channel);
      };
    }

    init();

    return () => {
      isMounted = false;
      channelCleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Link href="/notifications" aria-label="Notifications" className="relative mt-1 shrink-0">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 9a6 6 0 1 1 12 0c0 3 1 5 1.5 6H4.5C5 14 6 12 6 9Z"
          stroke="rgb(var(--ink) / 0.7)"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M9.5 18a2.5 2.5 0 0 0 5 0" stroke="rgb(var(--ink) / 0.7)" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold leading-none text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
