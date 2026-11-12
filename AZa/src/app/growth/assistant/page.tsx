"use client";

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import { api } from "@/lib/aza/api";
import { cn } from "@/lib/utils";

// Starter prompts shown on the empty state — the "suggestion chip" move from
// the reference screens (AI Tutor / AI Assistant cards), done as plain
// themed buttons rather than a mascot or animated orb.
const STARTER_PROMPTS = [
  "How do I start learning product design for free?",
  "Summarize my week",
  "Create a study plan",
  "Help with my assignment",
];

export default function AssistantPage() {
  const [msgs, setMsgs] = useState<
    { me: boolean; text: string; note?: string | undefined; error?: boolean }[]
  >([]);
  const [busy, setBusy] = useState(false);

  async function ask(q: string) {
    if (!q.trim() || busy) return;
    setMsgs((m) => [...m, { me: true, text: q }]);
    setBusy(true);
    try {
      const { answer, hasResults } = await api.askAssistant(q);
      setMsgs((m) => [
        ...m,
        {
          me: false,
          text: answer,
          note: hasResults ? undefined : "No matching opportunities or courses on Aza yet.",
        },
      ]);
    } catch (err) {
      setMsgs((m) => [
        ...m,
        {
          me: false,
          text: err instanceof Error ? err.message : "Something went wrong. Try again.",
          error: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const q = String(new FormData(f).get("q") ?? "").trim();
    if (!q) return;
    f.reset();
    await ask(q);
  }

  return (
    <AppShell>
      <BackLink to="/growth" label="Growth" />
      <PageHeader title="Assistant" sub="Ask about skills, ideas or your business" />
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 min-h-48 space-y-3 rounded-lg border bg-muted/50 p-4">
          {msgs.length === 0 && (
            <div>
              <p className="mb-3 text-sm text-muted-foreground">Ask about skills, ideas, or your business — or try one of these:</p>
              <div className="flex flex-wrap gap-2">
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => ask(p)}
                    disabled={busy}
                    className="rounded-md border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary-soft disabled:opacity-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={cn("max-w-[85%]", m.me && "ml-auto")}>
              <p
                className={cn(
                  "whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-sm",
                  m.me
                    ? "bg-primary text-primary-foreground font-medium"
                    : m.error
                      ? "border border-destructive/40 bg-card text-destructive"
                      : "border bg-card text-foreground",
                )}
              >
                {m.text}
              </p>
              {m.note && <p className="mt-1 text-xs text-muted-foreground">{m.note}</p>}
            </div>
          ))}
          {busy && <p className="text-sm text-muted-foreground animate-pulse">Thinking…</p>}
        </div>
        <form onSubmit={send} className="flex gap-2">
          <input
            name="q"
            aria-label="Your question"
            placeholder="Ask a question"
            maxLength={300}
            disabled={busy}
            className="h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button className={btn.primary} aria-label="Send" disabled={busy}>
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}
