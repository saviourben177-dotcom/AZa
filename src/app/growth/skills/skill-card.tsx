"use client";

import { useState, useTransition } from "react";
import { updateSkillProgress, removeUserSkill } from "@/lib/actions/skills";
import { btn, Progress } from "@/components/aza/kit";
import { Tag } from "@/components/aza/ui";

export default function SkillCard({
  skillId,
  name,
  category,
  level,
  progress,
}: {
  skillId: string;
  name: string;
  category: string;
  level: string;
  progress: number;
}) {
  const [value, setValue] = useState(progress);
  const [isPending, startTransition] = useTransition();

  function bump() {
    const next = Math.min(100, value + 10);
    setValue(next);
    startTransition(() => updateSkillProgress(skillId, next));
  }

  function remove() {
    startTransition(() => removeUserSkill(skillId));
  }

  return (
    <li className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-bold text-foreground">{name}</span>
        {value === 100 ? <Tag tone="primary">Complete</Tag> : <Tag>{category}</Tag>}
      </div>
      <Progress value={value} />
      <div className="mt-3 flex items-center justify-between">
        <span className="tabular text-sm font-bold text-primary-strong">{value}%</span>
        <div className="flex gap-2">
          <button className={btn.ghost} disabled={isPending} onClick={remove}>
            Remove
          </button>
          <button className={btn.secondary} disabled={isPending || value === 100} onClick={bump}>
            +10%
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs capitalize text-muted-foreground">{level}</p>
    </li>
  );
}
