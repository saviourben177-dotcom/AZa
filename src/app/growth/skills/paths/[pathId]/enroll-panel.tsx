"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { enrollInSkillPath } from "@/lib/actions/skill-paths";
import { btn } from "@/components/aza/kit";
import type { LearningStyle } from "@/lib/types";
import { LEARNING_STYLE_DESCRIPTIONS, LEARNING_STYLE_LABELS } from "@/lib/skill-path-visuals";

const STYLES: LearningStyle[] = ["entertaining", "focused", "practical"];

export default function EnrollPanel({ pathId }: { pathId: string }) {
  const [selected, setSelected] = useState<LearningStyle | null>(null);
  const [isPending, startTransition] = useTransition();

  function start() {
    startTransition(async () => {
      try {
        await enrollInSkillPath(pathId, selected ?? undefined);
        toast.success("You're enrolled — first checkpoint is unlocked.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't start this path");
      }
    });
  }

  return (
    <div className="mb-6 rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
      <p className="mb-3 text-sm font-semibold text-foreground">How do you learn best?</p>
      <div className="mb-4 grid gap-2">
        {STYLES.map((style) => (
          <button
            key={style}
            type="button"
            onClick={() => setSelected(style)}
            aria-pressed={selected === style}
            className={`rounded-md border p-3 text-left text-sm ${
              selected === style ? "border-primary bg-primary-soft" : "bg-background hover:bg-accent"
            }`}
          >
            <span className="block font-semibold">{LEARNING_STYLE_LABELS[style]}</span>
            <span className="block text-xs text-muted-foreground">{LEARNING_STYLE_DESCRIPTIONS[style]}</span>
          </button>
        ))}
      </div>
      <button className={`${btn.primary} w-full`} disabled={isPending} onClick={start}>
        {isPending ? "Starting..." : "Start this path"}
      </button>
    </div>
  );
}
