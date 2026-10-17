"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Briefcase, Compass, Home, Search, Sprout, User } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const tabs = [
  { to: "/", label: "Home", icon: Home, altMatch: null },
  { to: "/discover", label: "Discover", icon: Compass, altMatch: null },
  { to: "/growth", label: "Growth", icon: Sprout, altMatch: null },
  { to: "/businesses", label: "Business", icon: Briefcase, altMatch: "/business" },
  { to: "/profile", label: "Profile", icon: User, altMatch: null },
] as const;

function useUnreadNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let channelCleanup: (() => void) | undefined;
    const supabase = createClient();

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
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          () => {
            if (isMounted) setUnreadCount((c) => c + 1);
          }
        )
        .subscribe();

      channelCleanup = () => supabase.removeChannel(channel);
    }

    init();
    return () => {
      isMounted = false;
      channelCleanup?.();
    };
  }, []);

  return unreadCount;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const unreadCount = useUnreadNotificationCount();

  const isTabActive = (tab: (typeof tabs)[number]) => {
    if (tab.to === "/") return pathname === "/";
    if (pathname === tab.to || pathname.startsWith(tab.to + "/")) return true;
    if (tab.altMatch && (pathname === tab.altMatch || pathname.startsWith(tab.altMatch + "/"))) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 hidden border-b bg-background md:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
          <Link href="/" className="font-display text-xl font-extrabold tracking-tight">
            aza<span className="text-primary">.</span>
          </Link>
          <nav className="flex gap-1" aria-label="Main">
            {tabs.map((t) => {
              const active = isTabActive(t);
              return (
                <Link
                  key={t.to}
                  href={t.to}
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground",
                    active
                      ? "bg-primary-soft !text-primary-strong font-semibold"
                      : "text-muted-foreground",
                  )}
                >
                  <t.icon className="size-4" strokeWidth={2} />
                  {t.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex gap-1">
            <Link
              href="/search"
              aria-label="Search"
              className="grid size-11 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Search className="size-4" />
            </Link>
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative grid size-11 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <div className="flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
        <Link href="/" className="font-display text-xl font-extrabold tracking-tight">
          aza<span className="text-primary">.</span>
        </Link>
        <div className="flex gap-1">
          <Link
            href="/search"
            aria-label="Search"
            className="grid size-11 place-items-center rounded-md text-muted-foreground"
          >
            <Search className="size-5" />
          </Link>
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative grid size-11 place-items-center rounded-md text-muted-foreground"
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:px-6 md:pb-16 md:pt-10">{children}</main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {tabs.map((t) => {
          const active = isTabActive(t);
          return (
            <Link
              key={t.to}
              href={t.to}
              className={cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium",
                active
                  ? "!text-primary-strong font-bold before:absolute before:inset-x-5 before:top-0 before:h-0.5 before:rounded-full before:bg-primary"
                  : "text-muted-foreground",
              )}
            >
              <t.icon className="size-5" strokeWidth={2} />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
