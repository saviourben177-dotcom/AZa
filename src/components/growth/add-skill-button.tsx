"use client";

import { useTransition } from "react";
import { addUserSkill } from "@/lib/actions/skills";

export default function AddSkillButton({ skillId, name }: { skillId: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => addUserSkill(skillId))}
      disabled={isPending}
      className="rounded-pill bg-paper-dim px-3.5 py-2 text-[12.5px] font-semibold text-text-secondary disabled:opacity-50"
    >
      + {name}
    </button>
  );
}
