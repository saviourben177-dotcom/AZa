"use client";

import { useState } from "react";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn, Progress } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";
import { skills as initial } from "@/lib/aza-data";
import { api } from "@/lib/aza/api";
import { toast } from "sonner";

const suggestions = ["Public speaking", "Digital marketing", "Excel", "Sales"];

export default function SkillsPage() {
  const [list, setList] = useState(initial);

  async function bump(id: string) {
    const next = list.map((s) =>
      s.id === id ? { ...s, progress: Math.min(100, s.progress + 10) } : s,
    );
    setList(next);
    await api.updateSkillProgress(id, next.find((s) => s.id === id)!.progress);
  }

  async function add(name: string) {
    await api.addSkill(name);
    setList([...list, { id: name, name, category: "New", progress: 0 }]);
    toast.success(`${name} added`);
  }

  return (
    <AppShell>
      <BackLink to="/growth" label="Growth" />
      <PageHeader title="Skills" sub="Log progress after each lesson" />
      <ul className="mb-8 grid gap-3 md:grid-cols-2">
        {list.map((s) => (
          <li
            key={s.id}
            className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-bold text-foreground">{s.name}</span>
              {s.progress === 100 ? (
                <Tag tone="primary">Complete</Tag>
              ) : (
                <Tag>{s.category}</Tag>
              )}
            </div>
            <Progress value={s.progress} />
            <div className="mt-3 flex items-center justify-between">
              <span className="tabular text-sm font-bold text-primary-strong">
                {s.progress}%
              </span>
              <button
                className={btn.secondary}
                disabled={s.progress === 100}
                onClick={() => bump(s.id)}
              >
                +10%
              </button>
            </div>
          </li>
        ))}
      </ul>
      <h2 className="mb-3 text-lg font-display font-bold text-foreground">Add a skill</h2>
      <div className="flex flex-wrap gap-2">
        {suggestions
          .filter((n) => !list.some((s) => s.name === n))
          .map((n) => (
            <button key={n} className={btn.secondary} onClick={() => add(n)}>
              + {n}
            </button>
          ))}
      </div>
    </AppShell>
  );
}
