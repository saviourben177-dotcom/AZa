"use client";

import { useTransition, useRef, useState, useMemo } from "react";
import { createSkillResource } from "@/lib/actions/skill-resources";
import { SKILL_CATEGORY_LABEL, SKILL_CATEGORY_ORDER } from "@/lib/skill-visuals";
import type { SkillCategory } from "@/lib/types";

interface Skill {
  id: string;
  name: string;
  category: string;
}

const RESOURCE_TYPE_LABEL: Record<string, string> = {
  course: "Course — a full structured course (e.g. a Coursera/Udemy course)",
  article: "Article — a written guide or tutorial",
  video: "Video — a single video or video course",
  tool: "Tool — a practical tool, not learning content (e.g. a template, calculator)",
};

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner — no prior knowledge needed",
  intermediate: "Intermediate — assumes the basics",
  advanced: "Advanced — assumes real experience",
};

export default function CourseForm({ skills }: { skills: Skill[] }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [resourceType, setResourceType] = useState("course");
  const [level, setLevel] = useState("beginner");
  const [error, setError] = useState<string | null>(null);

  // Grouped by category (same order/labels as the rest of the app —
  // src/lib/skill-visuals.ts) so a curator always sees which sector a
  // skill belongs to right next to its name, instead of one long
  // alphabetical list where e.g. "Figma" (design) and "Forex Trading
  // Fundamentals" (trading) sit one apart with no visual cue.
  const skillsByCategory = useMemo(() => {
    const groups = new Map<string, Skill[]>();
    for (const s of skills) {
      const list = groups.get(s.category) ?? [];
      list.push(s);
      groups.set(s.category, list);
    }
    groups.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
    return groups;
  }, [skills]);

  const categoryKeys = Array.from(skillsByCategory.keys());
  const orderedCategories = [
    ...SKILL_CATEGORY_ORDER.filter((c) => skillsByCategory.has(c)),
    // Any category in the data that isn't one of the 6 known ones (shouldn't
    // happen, but skills.category is a plain text column with no DB-level
    // enum — see the NOTE in skill-visuals.ts) still shows up, not silently dropped.
    ...categoryKeys.filter((c) => !SKILL_CATEGORY_ORDER.includes(c as SkillCategory)),
  ];

  const selectedSkill = skills.find((s) => s.id === selectedSkillId);
  const selectedCategoryLabel = selectedSkill
    ? SKILL_CATEGORY_LABEL[selectedSkill.category as SkillCategory] ?? selectedSkill.category
    : null;

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createSkillResource(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      setSelectedSkillId("");
      setResourceType("course");
      setLevel("beginner");
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3 rounded-card border border-line bg-surface p-3.5">
      {/* Step 1: sector + skill together, so the category is never a guess */}
      <div>
        <label className="mb-1 block text-[11.5px] font-semibold text-ink/60">
          1. Which skill is this for? (grouped by sector)
        </label>
        <select
          name="skill_id"
          required
          value={selectedSkillId}
          onChange={(e) => setSelectedSkillId(e.target.value)}
          className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]"
        >
          <option value="">Select a skill…</option>
          {orderedCategories.map((cat) => (
            <optgroup key={cat} label={SKILL_CATEGORY_LABEL[cat as SkillCategory] ?? cat}>
              {(skillsByCategory.get(cat) ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {selectedSkill && (
          <p className="mt-1 text-[11px] text-ink/50">
            This will show under <span className="font-semibold text-ink/70">{selectedCategoryLabel}</span> →{" "}
            {selectedSkill.name}
          </p>
        )}
      </div>

      {/* Step 2: what the resource is, stated plainly (not just a short label) */}
      <div>
        <label className="mb-1 block text-[11.5px] font-semibold text-ink/60">2. What is it, exactly?</label>
        <input
          name="title"
          placeholder="Course / resource title"
          required
          className="mb-2 w-full rounded-card border border-line px-3 py-2 text-[13.5px]"
        />
        <input
          name="provider"
          placeholder="Provider (e.g. Coursera, YouTube, MIT OpenCourseWare)"
          className="mb-2 w-full rounded-card border border-line px-3 py-2 text-[13.5px]"
        />
        <input
          name="url"
          type="url"
          placeholder="https://..."
          required
          className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]"
        />
      </div>

      {/* Step 3: type + level, each with its full meaning spelled out so "course" vs "article" vs "tool" is never a guess */}
      <div>
        <label className="mb-1 block text-[11.5px] font-semibold text-ink/60">3. Format and level</label>
        <select
          name="resource_type"
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          className="mb-2 w-full rounded-card border border-line px-3 py-2 text-[13.5px]"
        >
          {Object.entries(RESOURCE_TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]"
        >
          {Object.entries(LEVEL_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <input
          name="duration_hours"
          type="number"
          step="0.5"
          min="0"
          placeholder="Duration (hrs, optional)"
          className="flex-1 rounded-card border border-line px-3 py-2 text-[13.5px]"
        />
        <input
          name="rating"
          type="number"
          step="0.1"
          min="0"
          max="5"
          placeholder="Rating 0–5 (optional)"
          className="flex-1 rounded-card border border-line px-3 py-2 text-[13.5px]"
        />
      </div>

      <div className="flex gap-4 text-[12.5px] text-ink/70">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="is_free" defaultChecked className="accent-aza" /> Free
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="curator_verified" className="accent-aza" /> Curator verified
        </label>
      </div>

      {/* Final summary chip — the whole point of the rebuild: see the exact category/skill/type/level combo before you commit, so a mis-click surfaces before saving, not after. */}
      {selectedSkill && (
        <div className="rounded-card bg-aza/8 px-3 py-2 text-[12px] text-ink/75">
          Will save as: <span className="font-semibold">{selectedCategoryLabel}</span> ›{" "}
          <span className="font-semibold">{selectedSkill.name}</span> ·{" "}
          {resourceType} · {level}
        </div>
      )}

      {error && (
        <div className="rounded-card bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-700">{error}</div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-card bg-aza py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Add course"}
      </button>
    </form>
  );
}
