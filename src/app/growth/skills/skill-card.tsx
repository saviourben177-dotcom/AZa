"use client";

import Link from "next/link";
import { useTransition } from "react";
import { removeUserSkill } from "@/lib/actions/skills";
import { btn, Progress } from "@/components/aza/kit";
import { Tag } from "@/components/aza/ui";

export default function SkillCard({
  skillId,
  name,
  category,
  categorySlug,
  level,
  progress,
}: {
  skillId: string;
  name: string;
  category: string;
  categorySlug: string;
  level: string;
  progress: number;
}) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    startTransition(() => removeUserSkill(skillId));
  }

  return (
    <li className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-bold text-foreground">{name}</span>
        {progress === 100 ? <Tag tone="primary">Complete</Tag> : <Tag>{category}</Tag>}
      </div>
      <Progress value={progress} />
      <div className="mt-3 flex items-center justify-between">
        <span className="tabular text-sm font-bold text-primary-strong">{progress}%</span>
        <div className="flex gap-2">
          <button className={btn.ghost} disabled={isPending} onClick={remove}>
            Remove
          </button>
          <Link href={`/growth/courses?category=${categorySlug}`} className={btn.secondary}>
            Find courses
          </Link>
        </div>
      </div>
      <p className="mt-1 text-xs capitalize text-muted-foreground">{level}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Progress updates automatically as you complete courses for this skill.
      </p>
    </li>
  );
}
