"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getPerson, reports, timeAgo } from "@/lib/aza-data";
import { api } from "@/lib/aza/api";
import { btn, Empty, Section } from "./kit";
import { Tag } from "./ui";

export function ReportsQueue() {
  const [list, setList] = useState(reports);
  async function act(id: string, action: "dismiss" | "remove") {
    await api.resolveReport(id, action);
    setList((l) => l.filter((r) => r.id !== id));
    toast.success(action === "remove" ? "Content removed" : "Report dismissed");
  }
  return (
    <Section title={`Reports (${list.length})`} className="mt-10">
      {list.length === 0 ? <Empty title="No open reports" /> : (
        <ul className="grid gap-3">
          {list.map((r) => (
            <li key={r.id} className="grid gap-3 rounded-lg border bg-card p-4 shadow-[var(--shadow-card)] sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-1.5"><Tag tone="urgent">{r.reason}</Tag><Tag>{r.type}</Tag></div>
                <p className="mt-2 font-medium">"{r.content}"</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {getPerson(r.reported).name} reported by {getPerson(r.reporter).name} · {timeAgo(r.hoursAgo)}
                </p>
              </div>
              <div className="flex gap-2">
                <button className={btn.danger} onClick={() => act(r.id, "remove")}>Remove content</button>
                <button className={btn.secondary} onClick={() => act(r.id, "dismiss")}>Dismiss</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
