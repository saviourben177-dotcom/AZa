"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn } from "@/components/aza/kit";
import { AuthorLine, PageHeader, Tag } from "@/components/aza/ui";
import { joinRequests } from "@/lib/aza-data";
import { api } from "@/lib/aza/api";

export default function RequestsPage() {
  const [list, setList] = useState(
    joinRequests.map((r) => ({ ...r, status: r.status as string })),
  );

  async function respond(id: string, status: "accepted" | "declined") {
    await api.respondToRequest(id, status);
    setList(list.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(`Request ${status}`);
  }

  return (
    <AppShell>
      <BackLink to="/businesses/team-finder" label="Team Finder" />
      <PageHeader title="Join requests" />
      <ul className="grid gap-3">
        {list.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <AuthorLine id={r.from} hoursAgo={r.hoursAgo} />
              <Tag
                tone={
                  r.status === "accepted"
                    ? "primary"
                    : r.status === "pending"
                      ? "urgent"
                      : "neutral"
                }
              >
                {r.status}
              </Tag>
            </div>
            <p className="text-sm text-foreground">
              <b>{r.role}</b> · {r.team}
            </p>
            <p className="mt-1 text-sm text-foreground/80">{r.note}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {r.status === "pending" && (
                <>
                  <button
                    className={btn.primary}
                    onClick={() => respond(r.id, "accepted")}
                  >
                    Accept
                  </button>
                  <button
                    className={btn.secondary}
                    onClick={() => respond(r.id, "declined")}
                  >
                    Decline
                  </button>
                </>
              )}
              <Link
                href={`/businesses/team-finder/messages/${r.id}`}
                className={btn.ghost}
              >
                Message
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
