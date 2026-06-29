"use client";

import { useTransition, useRef } from "react";
import { createBusinessTool } from "@/lib/actions/business-tools";

export default function ToolForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createBusinessTool(formData);
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2.5 rounded-card border border-line bg-surface p-3.5">
      <input name="title" placeholder="Tool title" required className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]" />
      <textarea name="description" placeholder="Short description (optional)" rows={2} className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]" />
      <select name="tool_type" className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]">
        <option value="guide">Guide</option>
        <option value="template">Template</option>
        <option value="calculator">Calculator</option>
        <option value="checklist">Checklist</option>
      </select>
      <input name="category" placeholder="Category (optional)" className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]" />
      <input name="url" type="url" placeholder="https://..." required className="w-full rounded-card border border-line px-3 py-2 text-[13.5px]" />
      <button type="submit" disabled={isPending} className="w-full rounded-card bg-aza py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60">
        {isPending ? "Saving..." : "Add tool"}
      </button>
    </form>
  );
}
