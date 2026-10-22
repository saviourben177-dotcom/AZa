"use client";

import { useTransition } from "react";
import { removeUserSkill } from "@/lib/actions/skills";

/**
 * Read-only progress display. This used to be a free-dragging slider that
 * let a user set progress to any arbitrary value with no connection to
 * actual activity — removed along with the equivalent "+10%" button on
 * SkillCard (see src/app/growth/skills/skill-card.tsx). progress_percent is
 * now computed server-side from real course completions
 * (markResourceComplete / markResourceIncomplete in
 * src/lib/actions/skills.ts) — this component only displays that number.
 */
export default function SkillProgressBar({ skillId, progress }: { skillId: string; progress: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-ink/50">
        <span>{progress}% complete</span>
        <button
          onClick={() => startTransition(() => removeUserSkill(skillId))}
          disabled={isPending}
          className="text-ink/35"
        >
          Remove
        </button>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-aza transition-[width]"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  );
}
