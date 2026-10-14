"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/aza/app-shell";
import { btn, Empty, Stat } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";
import { curatorQueue, getPerson, timeAgo } from "@/lib/aza-data";
import { api } from "@/lib/aza/api";
import { ReportsQueue } from "@/components/aza/reports-queue";

export default function CuratorPage() {
  const [list, setList] = useState(curatorQueue);

  async function act(id: string, kind: string, action: "approve" | "reject" | "remove") {
    await api.moderate(kind, id, action);
    setList(list.filter((q) => q.id !== id));
    toast.success(`${action.charAt(0).toUpperCase()}${action.slice(1)}d`);
  }

  return (
    <AppShell>
      <PageHeader title="Curator" sub="Review submitted opportunities, businesses and ideas." />
      <div className="mb-8 grid grid-cols-3 gap-3">
        <Stat label="In queue" value={list.length} />
        <Stat label="Approved this week" value={24} />
        <Stat label="Rejected" value={3} />
      </div>
      {list.length === 0 ? (
        <Empty title="Queue is clear" />
      ) : (
        <ul className="grid gap-3">
          {list.map((q) => (
            <li
              key={q.id}
              className="grid gap-3 rounded-lg border bg-card p-4 shadow-[var(--shadow-card)] sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <Tag tone="info">{q.kind}</Tag>
                <p className="mt-1.5 font-bold">{q.title}</p>
                <p className="text-sm text-muted-foreground">
                  by {getPerson(q.by).name} · {timeAgo(q.hoursAgo)}
                </p>
              </div>
              <div className="flex gap-2">
                <button className={btn.primary} onClick={() => act(q.id, q.kind, "approve")}>
                  Approve
                </button>
                <button className={btn.secondary} onClick={() => act(q.id, q.kind, "reject")}>
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8">
        <ReportsQueue />
      </div>
    </AppShell>
  );
}
