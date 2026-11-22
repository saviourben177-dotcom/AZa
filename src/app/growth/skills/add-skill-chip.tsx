"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { addUserSkill } from "@/lib/actions/skills";
import { btn } from "@/components/aza/kit";

export default function AddSkillChip({ skillId, name }: { skillId: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  function add() {
    startTransition(async () => {
      try {
        await addUserSkill(skillId);
        toast.success(`${name} added`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't add that skill");
      }
    });
  }

  return (
    <button className={btn.secondary} disabled={isPending} onClick={add}>
      + {name}
    </button>
  );
}
