"use client";

import { useState, useTransition } from "react";
import { updateCvSkills } from "@/lib/actions/cv-profile";

export default function CvSkillsEditor({ initialSkills }: { initialSkills: string[] }) {
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  function persist(next: string[]) {
    setSkills(next);
    startTransition(() => updateCvSkills(next));
  }

  function addSkill() {
    const trimmed = draft.trim();
    if (!trimmed || skills.includes(trimmed)) {
      setDraft("");
      return;
    }
    persist([...skills, trimmed]);
    setDraft("");
  }

  function removeSkill(skill: string) {
    persist(skills.filter((s) => s !== skill));
  }

  return (
    <div className="mt-2.5">
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <button
            key={skill}
            onClick={() => removeSkill(skill)}
            className="flex items-center gap-1.5 rounded-full bg-aza-light px-3 py-1.5 text-[12.5px] font-semibold text-aza-dark"
          >
            {skill}
            <span aria-hidden className="text-aza-dark/60">×</span>
          </button>
        ))}
        {skills.length === 0 && <p className="text-[12px] text-ink/45">No skills added yet.</p>}
      </div>

      <div className="mt-2.5 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSkill();
            }
          }}
          placeholder="e.g. Excel, Customer service, Welding"
          className="flex-1 rounded-card border border-line bg-surface px-4 py-2.5 text-[13.5px]"
        />
        <button
          onClick={addSkill}
          disabled={isPending}
          className="rounded-card bg-paper-dim px-4 py-2.5 text-[12.5px] font-bold text-ink/70 disabled:opacity-60"
        >
          Add
        </button>
      </div>
    </div>
  );
}
