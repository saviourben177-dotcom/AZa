"use client";

import Link from "next/link";
import { Check, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

type Step = { id: string; title: string; hint: string; href: string };

const STEPS: Step[] = [
  { id: "profile", title: "Create your profile", hint: "Done during sign up", href: "/profile" },
  { id: "save", title: "Save your first opportunity", hint: "Tap the bookmark on one you like", href: "/discover" },
  { id: "cv", title: "Preview your starter CV", hint: "We drafted it from your answers", href: "/profile/cv" },
  { id: "growth", title: "Explore the Growth Hub", hint: "Courses, skills and ideas", href: "/growth" },
];

const KEY = "aza:getting-started";

/** Checklist shown under the home search bar. Progress is kept on this device. */
export default function GettingStartedCard() {
  const [done, setDone] = useState<string[]>(["profile"]);
  const [hidden, setHidden] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "{}");
      setDone(Array.from(new Set(["profile", ...(s.done || [])])));
      setHidden(!!s.dismissed);
    } catch {
      setHidden(false);
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = (next: { done?: string[]; dismissed?: boolean }) => {
    const payload = { done, dismissed: hidden, ...next };
    localStorage.setItem(KEY, JSON.stringify(payload));
  };

  const mark = (id: string) => {
    if (done.includes(id)) return;
    const next = [...done, id];
    setDone(next);
    persist({ done: next });
  };

  const dismiss = () => {
    setHidden(true);
    persist({ dismissed: true });
  };

  // Avoid a flash of the card before localStorage has been read.
  if (!hydrated || hidden || done.length === STEPS.length) return null;
  const pct = Math.round((done.length / STEPS.length) * 100);

  return (
    <section className="mb-8">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground">Get started</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {done.length} of {STEPS.length} done
            </p>
          </div>
          <button
            type="button"
            aria-label="Hide checklist"
            onClick={dismiss}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <ul className="mt-3 divide-y divide-border">
          {STEPS.map((s) => {
            const ok = done.includes(s.id);
            return (
              <li key={s.id}>
                <Link
                  href={s.href}
                  onClick={() => mark(s.id)}
                  className="flex items-center gap-3 py-3 transition hover:opacity-80"
                >
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full border ${
                      ok ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    }`}
                  >
                    {ok && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-semibold ${
                        ok ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {s.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">{s.hint}</span>
                  </span>
                  {!ok && <ChevronRight className="size-4 text-muted-foreground" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
