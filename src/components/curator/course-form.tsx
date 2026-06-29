"use client";

import { useTransition, useRef } from "react";
import { createSkillResource } from "@/lib/actions/skill-resources";

interface Skill { id: string; name: string }

export default function CourseForm({ skills }: { skills: Skill[] }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createSkillResource(formData);
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2.5 rounded-card border border-line bg-surface p-3.5">
      <select name="skill_id" required className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]">
        <option value="">Select skill</option>
        {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <input name="title" placeholder="Course / resource title" required className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]" />
      <input name="provider" placeholder="Provider (e.g. Coursera, YouTube)" className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]" />
      <input name="url" type="url" placeholder="https://..." required className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]" />
      <div className="flex gap-2">
        <select name="resource_type" className="flex-1 rounded-card border border-line px-3 py-2 text-[13.5px]">
          <option value="course">Course</option>
          <option value="article">Article</option>
          <option value="video">Video</option>
          <option value="tool">Tool</option>
        </select>
        <select name="level" className="flex-1 rounded-card border border-line px-3 py-2 text-[13.5px]">
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      <div className="flex gap-2">
        <input name="duration_hours" type="number" step="0.5" placeholder="Duration (hrs)" className="flex-1 rounded-card border border-line px-3 py-2 text-[13.5px]" />
        <input name="rating" type="number" step="0.1" min="0" max="5" placeholder="Rating (0-5)" className="flex-1 rounded-card border border-line px-3 py-2 text-[13.5px]" />
      </div>
      <div className="flex gap-4 text-[12.5px] text-ink/70">
        <label className="flex items-center gap-1.5"><input type="checkbox" name="is_free" defaultChecked className="accent-aza" /> Free</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" name="curator_verified" className="accent-aza" /> Curator verified</label>
      </div>
      <button type="submit" disabled={isPending} className="w-full rounded-card bg-aza py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60">
        {isPending ? "Saving..." : "Add course"}
      </button>
    </form>
  );
}
