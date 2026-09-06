"use client";

import { useState, useTransition } from "react";
import type { Opportunity } from "@/lib/types";
import { OPPORTUNITY_CATEGORY_LABELS } from "@/lib/types";
import { GEOPOLITICAL_ZONES } from "@/lib/nigeria-locations";
import { COUNTRY_NAMES } from "@/lib/countries";

const CATEGORIES = Object.entries(OPPORTUNITY_CATEGORY_LABELS);

type RegionLockType = "none" | "nigeria_zone" | "country" | "nationwide" | "worldwide" | "legacy";

function classifyRegion(value: string): { type: RegionLockType; detail: string } {
  if (!value) return { type: "none", detail: "" };
  if (value === "Nationwide") return { type: "nationwide", detail: "" };
  if (value === "Worldwide") return { type: "worldwide", detail: "" };
  if ((GEOPOLITICAL_ZONES as readonly string[]).includes(value)) return { type: "nigeria_zone", detail: value };
  if (COUNTRY_NAMES.includes(value)) return { type: "country", detail: value };
  // Existing free-text value from before this picker existed — keep it
  // intact until the curator consciously replaces it, rather than
  // silently wiping data we don't recognize.
  return { type: "legacy", detail: value };
}

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
      <RegionLockField defaultValue={opportunity?.region ?? ""} />

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

      <div className="border-t border-line pt-3">
        <p className="text-[12px] font-bold uppercase tracking-wide text-ink/45">Display details (optional)</p>
        <p className="mt-1 text-[11.5px] text-ink/45">
          Leave blank to hide the corresponding badge/detail on the opportunity page rather than showing a guess.
        </p>
      </div>

      <Field label="Logo URL" name="logo_url" type="url" defaultValue={opportunity?.logo_url ?? ""} />

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Job type</label>
        <select
          name="job_type"
          defaultValue={opportunity?.job_type ?? ""}
          className="mt-1 w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-[14px]"
        >
          <option value="">Not specified</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="internship">Internship</option>
          <option value="contract">Contract</option>
          <option value="freelance">Freelance</option>
          <option value="volunteer">Volunteer</option>
        </select>
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Level</label>
        <select
          name="level"
          defaultValue={opportunity?.level ?? ""}
          className="mt-1 w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-[14px]"
        >
          <option value="">Not specified</option>
          <option value="entry">Entry</option>
          <option value="junior">Junior</option>
          <option value="mid">Mid</option>
          <option value="senior">Senior</option>
          <option value="any">Any level</option>
        </select>
      </div>

      <Field
        label="Salary range (display text, e.g. ₦70,000 – ₦120,000 / Month or $500 – $800 / Month)"
        name="salary_range"
        defaultValue={opportunity?.salary_range ?? ""}
      />
      <Field
        label="Experience required (display text, e.g. 0 – 2 Years)"
        name="experience_required"
        defaultValue={opportunity?.experience_required ?? ""}
      />
      <Field
        label="Applicants count (manually set, no live tracking yet)"
        name="applicants_count"
        type="number"
        defaultValue={opportunity?.applicants_count?.toString() ?? ""}
      />

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Paid?</label>
        <div className="mt-1.5 flex gap-4">
          <label className="flex items-center gap-1.5 text-[13px] text-ink/70">
            <input
              type="radio"
              name="paid"
              value="unknown"
              defaultChecked={opportunity?.paid === undefined || opportunity?.paid === null}
              className="h-3.5 w-3.5 accent-aza"
            />
            Not specified
          </label>
          <label className="flex items-center gap-1.5 text-[13px] text-ink/70">
            <input
              type="radio"
              name="paid"
              value="yes"
              defaultChecked={opportunity?.paid === true}
              className="h-3.5 w-3.5 accent-aza"
            />
            Yes
          </label>
          <label className="flex items-center gap-1.5 text-[13px] text-ink/70">
            <input
              type="radio"
              name="paid"
              value="no"
              defaultChecked={opportunity?.paid === false}
              className="h-3.5 w-3.5 accent-aza"
            />
            No
          </label>
        </div>
      </div>

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

/**
 * Two-step "scope then value" region-lock picker. Outputs a single hidden
 * `region` field so createOpportunity/updateOpportunity (which already
 * read `region` as plain FormData text) need no changes — this only
 * constrains what the curator can type, it doesn't touch how it's saved.
 */
function RegionLockField({ defaultValue }: { defaultValue: string }) {
  const initial = classifyRegion(defaultValue);
  const [type, setType] = useState<RegionLockType>(initial.type);
  const [zone, setZone] = useState(initial.type === "nigeria_zone" ? initial.detail : "");
  const [country, setCountry] = useState(initial.type === "country" ? initial.detail : "");

  const value =
    type === "nationwide" ? "Nationwide"
    : type === "worldwide" ? "Worldwide"
    : type === "nigeria_zone" ? zone
    : type === "country" ? country
    : type === "legacy" ? defaultValue
    : "";

  return (
    <div>
      <label className="text-[13px] font-semibold text-ink/70">Region lock</label>
      <select
        value={type}
        onChange={(e) => setType(e.target.value as RegionLockType)}
        className="mt-1 w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-[14px]"
      >
        <option value="none">No lock — not restricted to a place</option>
        <option value="nigeria_zone">Specific Nigeria zone</option>
        <option value="country">Specific country</option>
        <option value="nationwide">Nationwide (all of Nigeria)</option>
        <option value="worldwide">Worldwide</option>
        {initial.type === "legacy" && <option value="legacy">Keep existing value: &quot;{defaultValue}&quot;</option>}
      </select>

      {type === "nigeria_zone" && (
        <select
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          className="mt-1.5 w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-[14px]"
        >
          <option value="">Select a zone</option>
          {GEOPOLITICAL_ZONES.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      )}
      {type === "country" && (
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="mt-1.5 w-full rounded-card border border-line bg-surface px-3.5 py-2.5 text-[14px]"
        >
          <option value="">Select a country</option>
          {COUNTRY_NAMES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}

      <p className="mt-1 text-[11px] text-ink/40">
        Leave &quot;No lock&quot; for opportunities that aren&apos;t tied to one place. Pick a zone or country to
        restrict who sees this as a Nearby match. Nationwide/Worldwide are broadcast sentinels that reach
        every Nearby search, regardless of the viewer&apos;s own location.
      </p>

      <input type="hidden" name="region" value={value} />
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
