"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { markResourceComplete, markResourceIncomplete } from "@/lib/actions/skills";

/**
 * Marks a specific skill_resources row complete/incomplete for the current
 * user. This is the real signal behind user_skills.progress_percent (see
 * recomputeSkillProgress in src/lib/actions/skills.ts) — replaces the old
 * flat "+10% per click" button on the Skills page, which had no connection
 * to any actual resource or activity.
 */
export default function MarkCompleteButton({
  skillId,
  resourceId,
  initialCompleted,
  isAuthed,
}: {
  skillId: string;
  resourceId: string;
  initialCompleted: boolean;
  isAuthed: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthed) {
      router.push(`/login?next=/growth/courses`);
      return;
    }

    const next = !completed;
    setCompleted(next);
    startTransition(async () => {
      try {
        if (next) {
          await markResourceComplete(skillId, resourceId);
        } else {
          await markResourceIncomplete(skillId, resourceId);
        }
      } catch {
        // Revert optimistic update on failure.
        setCompleted(!next);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      aria-pressed={completed}
      aria-label={completed ? "Mark as not completed" : "Mark as completed"}
      className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
        completed
          ? "border-primary bg-primary-soft text-primary-strong"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      <Check className="size-3.5" />
      {completed ? "Completed" : "Mark complete"}
    </button>
  );
}
