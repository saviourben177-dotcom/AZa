"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { saveOnboarding, skipOnboarding, type OnboardingData } from "@/lib/actions/onboarding";

const STATUS_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self-employed / Entrepreneur" },
  { value: "unemployed", label: "Unemployed" },
  { value: "freelancer", label: "Freelancer" },
  { value: "other", label: "Other" },
];

const QUALIFICATIONS = [
  "No formal education", "Primary School", "Secondary School", "Diploma / OND",
  "Bachelor's Degree", "Master's Degree", "PhD / Doctorate", "Other",
];

const FIELDS = [
  "Computer Science", "Engineering", "Mechanical Engineering", "Marine Engineering",
  "Law", "Economics", "Art", "Science", "Textile and Design", "Trader / Business",
];

const INDUSTRIES = [
  "Technology", "Finance / Banking", "Healthcare", "Education", "Manufacturing",
  "Retail / Trade", "Agriculture", "Construction", "Media / Entertainment", "Government / Public Sector",
];

const LEARNING_CONTEXTS = [
  { value: "university", label: "In University" },
  { value: "polytechnic", label: "Polytechnic" },
  { value: "online", label: "Online Learning" },
  { value: "vocational", label: "Vocational / Skill Training" },
  { value: "not_learning", label: "Not learning currently" },
  { value: "other", label: "Other" },
];

const REGIONS = ["North Central", "North East", "North West", "South East", "South South", "South West"];

// Each entry is a "virtual step" key. Some are always present; status-branch
// keys are inserted dynamically based on what was picked in the "status" step.
type StepKey =
  | "name" | "age" | "status"
  | "field_student" | "job_employed" | "business_self_employed" | "freelance_skill" | "field_unemployed"
  | "disability" | "qualification" | "skilled" | "region" | "location_access"
  | "exact_location" | "learning" | "notes";

function buildSteps(status: string[]): StepKey[] {
  const branch: StepKey[] = [];
  if (status.includes("student")) branch.push("field_student");
  if (status.includes("employed")) branch.push("job_employed");
  if (status.includes("self_employed")) branch.push("business_self_employed");
  if (status.includes("freelancer")) branch.push("freelance_skill");
  if (status.includes("unemployed") && branch.length === 0) branch.push("field_unemployed");
  // if nothing selected yet (or only "other"), fall back to the generic field question
  if (branch.length === 0) branch.push("field_unemployed");

  return [
    "name", "age", "status",
    ...branch,
    "disability", "qualification", "skilled", "region", "location_access",
    "exact_location", "learning", "notes",
  ];
}

export default function OnboardingFlow() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({ status: [], learning_context: [] });
  const [fieldQuery, setFieldQuery] = useState("");

  const steps = useMemo(() => buildSteps(data.status ?? []), [data.status]);
  const totalSteps = steps.length;
  const currentKey = steps[stepIndex];

  function next() {
    if (stepIndex < totalSteps - 1) setStepIndex(stepIndex + 1);
    else finish();
  }
  function back() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  async function skipAll() {
    setSaving(true);
    await skipOnboarding();
    router.push("/");
    router.refresh();
  }

  async function finish() {
    setSaving(true);
    await saveOnboarding(data);
    router.push("/");
    router.refresh();
  }

  function toggleArrayValue(key: "status" | "learning_context", value: string) {
    setData((d) => {
      const arr = d[key] ?? [];
      const has = arr.includes(value);
      const updated = has ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...d, [key]: updated };
    });
  }

  const filteredFields = FIELDS.filter((f) => f.toLowerCase().includes(fieldQuery.toLowerCase()));
  const filteredIndustries = INDUSTRIES.filter((f) => f.toLowerCase().includes(fieldQuery.toLowerCase()));

  return (
    <div className="flex min-h-screen flex-col px-5 pb-8 pt-6">
      <div className="flex items-center gap-3">
        {stepIndex > 0 && (
          <button onClick={back} aria-label="Back" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-dim">
          <div className="h-full rounded-full bg-aza transition-all" style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }} />
        </div>
        <span className="shrink-0 text-[11px] font-bold text-ink/40 tabular">{stepIndex + 1}/{totalSteps}</span>
      </div>

      <div className="mt-8 flex-1">
        {currentKey === "name" && (
          <StepShell title="Let's get to know you" subtitle="This helps us match you with the right opportunities.">
            <input
              autoFocus
              placeholder="Enter your full name"
              value={data.full_name ?? ""}
              onChange={(e) => setData({ ...data, full_name: e.target.value })}
              className="mt-6 w-full rounded-card-sm border border-line-strong bg-surface shadow-card px-4 py-3.5 text-[15px]"
            />
          </StepShell>
        )}

        {currentKey === "age" && (
          <StepShell title="How old are you?" subtitle="This helps us personalize your experience.">
            <div className="mt-8 flex items-center justify-center gap-6">
              <RoundButton onClick={() => setData((d) => ({ ...d, age: Math.max(13, (d.age ?? 18) - 1) }))}>−</RoundButton>
              <span className="font-display text-4xl font-extrabold text-ink tabular">{data.age ?? 18}</span>
              <RoundButton onClick={() => setData((d) => ({ ...d, age: Math.min(99, (d.age ?? 18) + 1) }))}>+</RoundButton>
            </div>
            <p className="mt-2 text-center text-[13px] text-ink/50">years old</p>
          </StepShell>
        )}

        {currentKey === "status" && (
          <StepShell title="What do you do?" subtitle="Select all that apply — we'll ask the right follow-up for each.">
            <div className="mt-6 space-y-2.5">
              {STATUS_OPTIONS.map((opt) => (
                <CheckRow key={opt.value} label={opt.label} checked={(data.status ?? []).includes(opt.value)} onClick={() => toggleArrayValue("status", opt.value)} />
              ))}
              {(data.status ?? []).includes("other") && (
                <input
                  placeholder="Please specify"
                  value={data.status_other ?? ""}
                  onChange={(e) => setData({ ...data, status_other: e.target.value })}
                  className="w-full rounded-card-sm border border-line-strong bg-surface shadow-card px-4 py-3 text-[14px]"
                />
              )}
            </div>
          </StepShell>
        )}

        {currentKey === "field_student" && (
          <StepShell title="What's your field of study?" subtitle="Search or add your course.">
            <FieldPicker
              query={fieldQuery}
              setQuery={setFieldQuery}
              options={filteredFields}
              selected={data.field_of_interest}
              onSelect={(v) => setData({ ...data, field_of_interest: v })}
              placeholder="Search or add your field"
            />
          </StepShell>
        )}

        {currentKey === "field_unemployed" && (
          <StepShell title="What field are you looking to enter?" subtitle="Search or add the field you're interested in.">
            <FieldPicker
              query={fieldQuery}
              setQuery={setFieldQuery}
              options={filteredFields}
              selected={data.field_of_interest}
              onSelect={(v) => setData({ ...data, field_of_interest: v })}
              placeholder="Search or add a field"
            />
          </StepShell>
        )}

        {currentKey === "job_employed" && (
          <StepShell title="Tell us about your job" subtitle="What's your job title and industry?">
            <input
              placeholder="Job title (e.g. Software Engineer)"
              value={data.job_title ?? ""}
              onChange={(e) => setData({ ...data, job_title: e.target.value })}
              className="mt-6 w-full rounded-card-sm border border-line-strong bg-surface shadow-card px-4 py-3.5 text-[14px]"
            />
            <p className="mt-5 text-[12px] font-semibold uppercase tracking-wide text-ink/40">Industry</p>
            <FieldPicker
              query={fieldQuery}
              setQuery={setFieldQuery}
              options={filteredIndustries}
              selected={data.industry}
              onSelect={(v) => setData({ ...data, industry: v })}
              placeholder="Search or add your industry"
              hideLabel
            />
          </StepShell>
        )}

        {currentKey === "business_self_employed" && (
          <StepShell title="What's your business about?" subtitle="A short description helps us suggest relevant grants, ideas and tools.">
            <textarea
              placeholder="E.g. I run a small catering business in Lagos..."
              value={data.business_description ?? ""}
              onChange={(e) => setData({ ...data, business_description: e.target.value })}
              rows={4}
              className="mt-6 w-full rounded-card-sm border border-line-strong bg-surface shadow-card px-4 py-3.5 text-[14px]"
            />
          </StepShell>
        )}

        {currentKey === "freelance_skill" && (
          <StepShell title="What service or skill do you offer?" subtitle="E.g. Graphic design, web development, copywriting...">
            <input
              placeholder="Your main skill or service"
              value={data.freelance_skill ?? ""}
              onChange={(e) => setData({ ...data, freelance_skill: e.target.value })}
              className="mt-6 w-full rounded-card-sm border border-line-strong bg-surface shadow-card px-4 py-3.5 text-[14px]"
            />
          </StepShell>
        )}

        {currentKey === "disability" && (
          <StepShell title="Any disability or health concerns?" subtitle="This is optional and stays private.">
            <div className="mt-6 space-y-2.5">
              <CheckRow label="None" checked={data.disability_or_health_note === ""} onClick={() => setData({ ...data, disability_or_health_note: "" })} />
              <CheckRow label="Yes, I have a disability or health concern" checked={!!data.disability_or_health_note && data.disability_or_health_note !== ""} onClick={() => setData({ ...data, disability_or_health_note: data.disability_or_health_note || " " })} />
            </div>
            {data.disability_or_health_note !== "" && (
              <textarea
                placeholder="You can tell us more (optional). E.g. Asthma, vision impairment..."
                value={data.disability_or_health_note?.trim() ?? ""}
                onChange={(e) => setData({ ...data, disability_or_health_note: e.target.value })}
                rows={3}
                className="mt-3 w-full rounded-card-sm border border-line-strong bg-surface shadow-card px-4 py-3 text-[14px]"
              />
            )}
          </StepShell>
        )}

        {currentKey === "qualification" && (
          <StepShell title="What's your highest qualification?" subtitle="Select the highest level you've completed.">
            <div className="mt-6 space-y-1.5">
              {QUALIFICATIONS.map((q) => (
                <RadioRow key={q} label={q} checked={data.highest_qualification === q} onClick={() => setData({ ...data, highest_qualification: q })} />
              ))}
            </div>
          </StepShell>
        )}

        {currentKey === "skilled" && (
          <StepShell title="Do you consider yourself skilled or unskilled?" subtitle="You can choose both if applicable.">
            <div className="mt-6 space-y-2.5">
              {[{ value: "skilled", label: "Skilled" }, { value: "unskilled", label: "Unskilled" }, { value: "both", label: "Both" }, { value: "not_sure", label: "Not sure yet" }].map((opt) => (
                <RadioRow key={opt.value} label={opt.label} checked={data.skilled_or_unskilled === opt.value} onClick={() => setData({ ...data, skilled_or_unskilled: opt.value })} />
              ))}
            </div>
          </StepShell>
        )}

        {currentKey === "region" && (
          <StepShell title="Which region are you in?" subtitle="This helps us show local opportunities.">
            <select value={data.region ?? ""} onChange={(e) => setData({ ...data, region: e.target.value })} className="mt-6 w-full rounded-card-sm border border-line-strong bg-surface shadow-card px-4 py-3.5 text-[14px]">
              <option value="">Select your region</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </StepShell>
        )}

        {currentKey === "location_access" && (
          <StepShell title="Allow location access" subtitle="We use your location to show nearby opportunities, events and resources.">
            <div className="mt-6 flex flex-col items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-aza-light shadow-card">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7Z" stroke="rgb(var(--accent))" strokeWidth="1.8" strokeLinejoin="round" />
                  <circle cx="12" cy="9" r="2.5" stroke="rgb(var(--accent))" strokeWidth="1.8" />
                </svg>
              </div>
              <button
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(() => next(), () => next());
                  } else next();
                }}
                className="mt-8 w-full rounded-pill bg-aza py-3.5 text-[15px] font-bold text-white shadow-glow-accent"
              >
                Allow Location Access
              </button>
            </div>
          </StepShell>
        )}

        {currentKey === "exact_location" && (
          <StepShell title="What's your exact location? (Optional)" subtitle="Add your city or area for better recommendations.">
            <input
              placeholder="Enter your city or area"
              value={data.exact_location ?? ""}
              onChange={(e) => setData({ ...data, exact_location: e.target.value })}
              className="mt-6 w-full rounded-card-sm border border-line-strong bg-surface shadow-card px-4 py-3.5 text-[14px]"
            />
          </StepShell>
        )}

        {currentKey === "learning" && (
          <StepShell title="Are you currently learning?" subtitle="Select all that apply.">
            <div className="mt-6 space-y-2.5">
              {LEARNING_CONTEXTS.map((opt) => (
                <CheckRow key={opt.value} label={opt.label} checked={(data.learning_context ?? []).includes(opt.value)} onClick={() => toggleArrayValue("learning_context", opt.value)} />
              ))}
            </div>
          </StepShell>
        )}

        {currentKey === "notes" && (
          <StepShell title="Anything else we should know?" subtitle="This can help us serve you better.">
            <textarea
              placeholder="Tell us anything (optional) — e.g. your goals, interests, what you need..."
              value={data.additional_notes ?? ""}
              onChange={(e) => setData({ ...data, additional_notes: e.target.value })}
              rows={5}
              className="mt-6 w-full rounded-card-sm border border-line-strong bg-surface shadow-card px-4 py-3.5 text-[14px]"
            />
          </StepShell>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <button onClick={next} disabled={saving} className="w-full rounded-pill bg-aza py-3.5 text-[15px] font-bold text-white shadow-glow-accent disabled:opacity-60">
          {saving ? "Saving..." : stepIndex === totalSteps - 1 ? "Finish" : "Continue"}
        </button>
        {stepIndex < totalSteps - 1 && (
          <button onClick={next} className="w-full text-center text-[13px] font-bold text-ink/40">Skip for now</button>
        )}
        {stepIndex === 0 && (
          <button onClick={skipAll} className="w-full text-center text-[12px] text-ink/30">Skip onboarding entirely</button>
        )}
      </div>
    </div>
  );
}

function FieldPicker({
  query, setQuery, options, selected, onSelect, placeholder, hideLabel,
}: {
  query: string; setQuery: (v: string) => void; options: string[]; selected?: string;
  onSelect: (v: string) => void; placeholder: string; hideLabel?: boolean;
}) {
  return (
    <div>
      <input
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={`${hideLabel ? "mt-2" : "mt-6"} w-full rounded-card-sm border border-line-strong bg-surface px-4 py-3 text-[14px] shadow-card`}
      />
      {!hideLabel && <p className="mt-4 text-[12px] font-bold uppercase tracking-wide text-ink/40">Popular</p>}
      <div className={`${hideLabel ? "mt-2" : "mt-2"} space-y-1.5`}>
        {options.map((f) => (
          <button
            key={f}
            onClick={() => { onSelect(f); setQuery(f); }}
            className={`block w-full rounded-card-sm px-4 py-2.5 text-left text-[14px] ${selected === f ? "bg-aza-light font-bold text-aza" : "text-ink/75"}`}
          >
            {f}
          </button>
        ))}
        {query && !options.includes(query) && (
          <button onClick={() => onSelect(query)} className="block w-full rounded-card-sm px-4 py-2.5 text-left text-[14px] font-bold text-aza">
            + Add &quot;{query}&quot;
          </button>
        )}
      </div>
    </div>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-[22px] font-bold leading-tight text-ink">{title}</h1>
      <p className="mt-1.5 text-[13.5px] text-ink/55">{subtitle}</p>
      {children}
    </div>
  );
}

function CheckRow({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center justify-between rounded-card-sm border px-4 py-3.5 text-left shadow-card transition-colors ${checked ? "border-aza bg-aza-light" : "border-line-strong bg-surface"}`}>
      <span className="text-[14px] font-semibold text-ink">{label}</span>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${checked ? "border-aza bg-aza" : "border-line-strong"}`}>
        {checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </span>
    </button>
  );
}

function RadioRow({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center justify-between rounded-card-sm border px-4 py-3.5 text-left shadow-card transition-colors ${checked ? "border-aza bg-aza-light" : "border-line-strong bg-surface"}`}>
      <span className="text-[14px] font-semibold text-ink">{label}</span>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${checked ? "border-aza" : "border-line-strong"}`}>
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-aza" />}
      </span>
    </button>
  );
}

function RoundButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex h-12 w-12 items-center justify-center rounded-full border border-line-strong bg-surface text-xl font-bold text-ink/60 shadow-card">
      {children}
    </button>
  );
}
