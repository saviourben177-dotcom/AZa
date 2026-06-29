"use client";

import { useTransition } from "react";
import type { Opportunity } from "@/lib/types";
import { OPPORTUNITY_CATEGORY_LABELS } from "@/lib/types";

const CATEGORIES = Object.entries(OPPORTUNITY_CATEGORY_LABELS);

export default function OpportunityForm({
  opportunity,
  action,
}: {
  opportunity?: Opportunity;
  action: (formData: FormData) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(() => action(formData));
  }

  return (
    <form action={handleSubmit} className="space-y-3 pb-10">
      <Field label="Title" name="title" required defaultValue={opportunity?.title} />
      <Field label="Organization" name="org" required defaultValue={opportunity?.org} />

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Category</label>
        <select
          name="category"
          required
          defaultValue={opportunity?.category}
          className="mt-1 w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-[14px]"
        >
          <option value="">Select category</option>
          {CATEGORIES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <TextArea
        label="Description"
        name="description"
        required
        defaultValue={opportunity?.description}
      />
      <TextArea
        label="Eligibility (optional)"
        name="eligibility"
        defaultValue={opportunity?.eligibility ?? ""}
      />

      <Field
        label="Deadline"
        name="deadline"
        type="date"
        defaultValue={opportunity?.deadline ?? ""}
      />
      <Field
        label="Apply URL"
        name="apply_url"
        type="url"
        required
        defaultValue={opportunity?.apply_url}
      />
      <Field
        label="Location (optional)"
        name="location"
        defaultValue={opportunity?.location ?? ""}
      />
      <Field
        label="Tags (comma-separated)"
        name="tags"
        defaultValue={opportunity?.tags?.join(", ") ?? ""}
      />

      <div className="flex gap-2">
        <Field label="Min age (optional)" name="min_age" type="number" defaultValue={opportunity?.min_age?.toString() ?? ""} />
        <Field label="Max age (optional)" name="max_age" type="number" defaultValue={opportunity?.max_age?.toString() ?? ""} />
      </div>
      <Field label="Region lock (optional, leave blank for national/remote)" name="region" defaultValue={opportunity?.region ?? ""} />

      <div>
        <label className="text-[13px] font-semibold text-ink/70">
          Relevant to (leave all unchecked = shown to everyone)
        </label>
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          {["student", "employed", "self_employed", "unemployed", "freelancer"].map((s) => (
            <label key={s} className="flex items-center gap-1.5 text-[12.5px] text-ink/70">
              <input
                type="checkbox"
                name="relevant_status"
                value={s}
                defaultChecked={opportunity?.relevant_status?.includes(s)}
                className="h-3.5 w-3.5 accent-aza"
              />
              {s.replace("_", " ")}
            </label>
          ))}
        </div>
      </div>

      <Checkbox
        label="Remote"
        name="remote"
        defaultChecked={opportunity?.remote}
      />
      <Checkbox
        label="Mark as curator-verified"
        name="curator_verified"
        defaultChecked={opportunity?.curator_verified}
      />

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-card bg-aza py-3 text-[14px] font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Saving..." : opportunity ? "Save changes" : "Create opportunity"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="text-[13px] font-semibold text-ink/70">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-[14px]"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="text-[13px] font-semibold text-ink/70">{label}</label>
      <textarea
        name={name}
        required={required}
        defaultValue={defaultValue}
        rows={4}
        className="mt-1 w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-[14px]"
      />
    </div>
  );
}

function Checkbox({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-[13px] font-medium text-ink/70">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-line accent-aza"
      />
      {label}
    </label>
  );
}
