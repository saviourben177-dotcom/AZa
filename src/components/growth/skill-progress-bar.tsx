"use client";

import { useState, useTransition } from "react";
import { updateSkillProgress, removeUserSkill } from "@/lib/actions/skills";

export default function SkillProgressBar({ skillId, progress }: { skillId: string; progress: number }) {
  const [value, setValue] = useState(progress);
  const [isPending, startTransition] = useTransition();

  function commit(next: number) {
    setValue(next);
    startTransition(() => updateSkillProgress(skillId, next));
  }

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-ink/50">
        <span>{value}% complete</span>
        <button
          onClick={() => startTransition(() => removeUserSkill(skillId))}
          disabled={isPending}
          className="text-ink/35"
        >
          Remove
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => commit(parseInt(e.target.value, 10))}
        className="mt-1.5 w-full accent-aza"
      />
    </div>
  );
}
