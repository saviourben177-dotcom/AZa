"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { respondToJoinRequest } from "@/lib/actions/team-finder";
import { relativeTime } from "@/lib/types";

export default function RequestRow({
  requestId,
  ideaId,
  ideaTitle,
  roleName,
  requesterName,
  avatarUrl,
  message,
  status,
  createdAt,
  isNew,
}: {
  requestId: string;
  ideaId: string;
  ideaTitle: string;
  roleName: string;
  requesterName: string;
  avatarUrl?: string | null;
  message: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  isNew?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(status);

  function respond(decision: "accepted" | "declined") {
    setLocalStatus(decision);
    startTransition(() => respondToJoinRequest(requestId, ideaId, decision));
  }

  return (
    <div className="rounded-card-sm bg-surface shadow-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-aza/20" />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-aza-light text-[14px] font-semibold text-aza ring-2 ring-aza/15">
            {requesterName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[13.5px] font-semibold text-ink">{requesterName}</p>
            {isNew && localStatus === "pending" && (
              <span className="shrink-0 rounded-pill bg-aza px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                New
              </span>
            )}
          </div>
          <p className="text-[11.5px] font-semibold text-text-tertiary">{roleName}</p>
          <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink/60">{message}</p>
          <p className="mt-1 text-[10.5px] font-medium text-text-tertiary">{ideaTitle} · {relativeTime(createdAt)}</p>
        </div>
      </div>

      <div className="mt-3.5 flex gap-2">
        {localStatus === "pending" ? (
          <>
            <button
              disabled={isPending}
              onClick={() => respond("accepted")}
              className="flex-1 rounded-card-sm bg-aza py-2.5 text-[12.5px] font-semibold text-white shadow-card disabled:opacity-60"
            >
              Accept
            </button>
            <button
              disabled={isPending}
              onClick={() => respond("declined")}
              className="flex-1 rounded-card-sm bg-surface shadow-card py-2.5 text-[12.5px] font-semibold text-ink/60 disabled:opacity-60"
            >
              Decline
            </button>
            <Link
              href={`/businesses/team-finder/messages/${requestId}`}
              className="flex items-center justify-center rounded-card-sm bg-surface shadow-card px-3.5 text-text-secondary"
              aria-label="Message"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 4h16v12H8l-4 4V4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
            </Link>
          </>
        ) : (
          <span
            className={`w-full rounded-card-sm py-2.5 text-center text-[12.5px] font-semibold capitalize ${
              localStatus === "accepted" ? "bg-aza-light text-aza" : "bg-paper-dim text-text-tertiary"
            }`}
          >
            {localStatus}
          </span>
        )}
      </div>
    </div>
  );
}
