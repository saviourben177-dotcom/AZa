"use client";

import { useTransition } from "react";
import { addUserSkill } from "@/lib/actions/skills";

export default function AddSkillButton({ skillId, name }: { skillId: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => addUserSkill(skillId))}
      disabled={isPending}
      className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink/70 disabled:opacity-50"
    >
      + {name}
    </button>
  );
}
