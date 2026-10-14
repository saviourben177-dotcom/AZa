"use client";

import { Send } from "lucide-react";
import { use, useState, type FormEvent } from "react";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import { ReportButton } from "@/components/aza/report";
import { getPerson, me, messages, timeAgo } from "@/lib/aza-data";
import { api } from "@/lib/aza/api";
import { cn } from "@/lib/utils";

export default function ChatPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);
  const [list, setList] = useState(messages);

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const body = String(new FormData(f).get("body") ?? "").trim();
    if (!body) return;
    f.reset();
    await api.sendMessage(requestId, body);
    setList([...list, { id: String(Date.now()), author: me.id, body, hoursAgo: 0 }]);
  }

  return (
    <AppShell>
      <BackLink to="/businesses/team-finder/my-requests" label="Requests" />
      <PageHeader title="Messages" />
      <div className="mx-auto max-w-2xl">
        <ul className="mb-4 space-y-3">
          {list.map((m) => {
            const mine = m.author === me.id || m.author === "ada";
            return (
              <li
                key={m.id}
                className={cn("max-w-[85%]", mine && "ml-auto text-right")}
              >
                <p
                  className={cn(
                    "inline-block rounded-lg px-3.5 py-2.5 text-left text-sm",
                    mine
                      ? "bg-primary text-primary-foreground font-medium"
                      : "border bg-card text-foreground",
                  )}
                >
                  {m.body}
                </p>
                <p
                  className={cn(
                    "mt-1 flex items-center gap-1 text-xs text-muted-foreground",
                    mine && "justify-end",
                  )}
                >
                  {getPerson(m.author).name} · {timeAgo(m.hoursAgo)}
                  {!mine && (
                    <ReportButton
                      className="size-8"
                      target={{
                        type: "message",
                        id: m.id,
                        userId: m.author,
                        content: m.body,
                      }}
                    />
                  )}
                </p>
              </li>
            );
          })}
        </ul>
        <form onSubmit={send} className="flex gap-2">
          <input
            name="body"
            aria-label="Message"
            placeholder="Write a message"
            className="h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button className={btn.primary} aria-label="Send">
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}
