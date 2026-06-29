"use client";

import { useTransition } from "react";
import { deleteSkillResource } from "@/lib/actions/skill-resources";

export default function DeleteCourseButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => { if (confirm("Delete this course?")) startTransition(() => deleteSkillResource(id)); }}
      disabled={isPending}
      className="text-[12px] font-semibold text-ink/40 disabled:opacity-50"
    >
      {isPending ? "..." : "Delete"}
    </button>
  );
}
