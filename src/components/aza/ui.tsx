"use client";

import Link from "next/link";
import { BadgeCheck, Clock } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getPerson, timeAgo, type Opportunity } from "@/lib/aza-data";
import AvatarImg from "@/components/aza/avatar-img";
import DefaultAvatar from "@/components/default-avatar";

export function Avatar({
  id,
  size = 40,
  name,
  avatarUrl,
  // Pass true for the signed-in user's own avatar (e.g. on /profile),
  // where there's no mock person to fall back to and a missing photo
  // should show the TikTok/Facebook-style silhouette, not initials.
  isRealUser = false,
}: {
  id: string;
  size?: number;
  // Real author data, when known (see mapDbIdeaToPrototype), takes
  // priority over the mock `people` lookup so real users show their
  // actual photo/initial instead of a mock person's initials.
  name?: string;
  avatarUrl?: string | null;
  isRealUser?: boolean;
}) {
  if (avatarUrl) {
    // Client component: catches a broken/expired URL (e.g. deleted
    // storage object) and falls back to the silhouette instead of a
    // broken-image icon.
    return <AvatarImg src={avatarUrl} alt={name ?? ""} size={size} />;
  }
  if (isRealUser) {
    return <DefaultAvatar className="shrink-0" style={{ width: size, height: size }} />;
  }
  if (name) {
    return (
      <span
        aria-hidden
        style={{ width: size, height: size }}
        className="grid shrink-0 place-items-center rounded-full emboss-primary font-display text-sm font-bold"
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }
  const p = getPerson(id);
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-full emboss-primary font-display text-sm font-bold"
    >
      {p.initials}
    </span>
  );
}

export function Tag({ children, icon, tone = "neutral" }: { children: ReactNode; icon?: ReactNode; tone?: "neutral" | "urgent" | "primary" | "info" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        tone === "neutral" && "border-border bg-muted text-muted-foreground",
        tone === "urgent" && "border-transparent bg-urgent-soft font-semibold text-urgent",
        tone === "primary" && "border-transparent bg-primary-soft font-semibold text-primary-strong",
        tone === "info" && "border-transparent bg-info-soft font-semibold text-info",
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function Deadline({ days }: { days: number }) {
  const urgent = days <= 7;
  return (
    <Tag tone={urgent ? "urgent" : "neutral"} icon={<Clock className="size-3.5" strokeWidth={2} />}>
      {days === 0 ? "Closes today" : `${days} days left`}
    </Tag>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function OpportunityCard({ o }: { o: Opportunity }) {
  return (
    <Link href={`/opportunities/${o.id}`} className="card-lift relative flex flex-col gap-3 overflow-hidden rounded-lg border bg-card p-4 pt-5">
      <span aria-hidden className={cn("absolute inset-x-0 top-0 h-1", o.daysLeft <= 7 ? "bg-urgent" : "bg-primary")} />
      <div className="flex min-w-0 items-start gap-3">
        <span className="emboss grid size-10 shrink-0 place-items-center rounded-md border font-display text-sm font-bold">
          {o.orgMark}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-primary-strong">{o.category}</p>
          <h3 className="text-base leading-snug">{o.title}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            {o.org}
            {o.verified && <BadgeCheck aria-label="Verified" className="size-4 text-primary" />}
          </p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        <Tag>{o.location}</Tag>
        {o.amount && <Tag tone="primary">{o.amount}</Tag>}
        <Deadline days={o.daysLeft} />
      </div>
    </Link>
  );
}

export function AuthorLine({
  id,
  hoursAgo,
  op,
  name,
  avatarUrl,
  currentUserId,
}: {
  id: string;
  hoursAgo: number;
  op?: boolean;
  // Real author data — pass these through from mapDbIdeaToPrototype's
  // authorName/authorAvatarUrl for real posts. Falls back to the mock
  // `people` dict only when absent (legacy/demo content).
  name?: string;
  avatarUrl?: string | null;
  // The viewer's own id, if logged in — tapping your own name/avatar
  // goes to the full /profile view instead of the read-only /u/[id].
  currentUserId?: string;
}) {
  const mock = name ? null : getPerson(id);
  const displayName = name ?? mock?.name ?? "Aza user";
  const href = currentUserId && currentUserId === id ? "/profile" : `/u/${id}`;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Link href={href} className="rounded-full" aria-label={`${displayName}'s profile`}>
        <Avatar id={id} name={name} avatarUrl={avatarUrl} />
      </Link>
      <div className="min-w-0 text-sm">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <Link href={href} className="font-semibold hover:underline">{displayName}</Link>
          {op && <span className="rounded-md bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground">Creator</span>}
        </div>
        <p className="truncate text-muted-foreground">
          {mock ? [mock.role, mock.location].filter(Boolean).join(" · ") + " · " : ""}{timeAgo(hoursAgo)}
        </p>
      </div>
    </div>
  );
}
