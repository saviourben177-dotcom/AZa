"use client";

import { useState, useTransition } from "react";
import { updateIdeaStage } from "@/lib/actions/ideas";

const STAGES = ["idea", "validation", "building", "launched"];

export default function IdeaStageControl({
  ideaId, currentStage, canEdit,
}: {
  ideaId: string; currentStage: string; canEdit: boolean;
}) {
  const [stage, setStage] = useState(currentStage);
  const [isPending, startTransition] = useTransition();

  if (!canEdit) {
    return (
      <span className="rounded-full bg-aza-light px-3 py-1.5 text-[12.5px] font-bold capitalize text-aza">
        {stage}
      </span>
    );
  }

  return (
    <div className="flex gap-1.5">
      {STAGES.map((s) => (
        <button
          key={s}
          disabled={isPending}
          onClick={() => {
            setStage(s);
            startTransition(() => updateIdeaStage(ideaId, s));
          }}
          className={`rounded-full px-3 py-1.5 text-[12px] font-bold capitalize ${
            stage === s ? "bg-aza text-white" : "bg-paper-dim text-ink/50"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
