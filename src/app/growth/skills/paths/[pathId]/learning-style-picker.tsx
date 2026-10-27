"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setLearningStyle } from "@/lib/actions/skill-paths";
import type { LearningStyle } from "@/lib/types";
import { LEARNING_STYLE_LABELS } from "@/lib/skill-path-visuals";

const STYLES: LearningStyle[] = ["entertaining", "focused", "practical"];

export default function LearningStylePicker({
  pathId,
  currentStyle,
}: {
  pathId: string;
  currentStyle: LearningStyle | null;
}) {
  const [isPending, startTransition] = useTransition();

  function change(style: LearningStyle) {
    if (style === currentStyle) return;
    startTransition(async () => {
      try {
        await setLearningStyle(pathId, style);
        toast.success(`Switched to ${LEARNING_STYLE_LABELS[style]} style`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't change style");
      }
    });
  }

  return (
    <div className="mb-6 flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Learning style:</span>
      <div className="flex gap-1.5">
        {STYLES.map((style) => (
          <button
            key={style}
            type="button"
            disabled={isPending}
            onClick={() => change(style)}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
              currentStyle === style
                ? "border-primary bg-primary-soft text-primary-strong"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {LEARNING_STYLE_LABELS[style]}
          </button>
        ))}
      </div>
    </div>
  );
}
