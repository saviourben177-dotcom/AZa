"use client";

import { useState, useTransition } from "react";
import { createIdea } from "@/lib/actions/ideas";

const CATEGORIES = ["Education", "Energy", "Health", "Agriculture", "Fintech", "Sustainability", "Logistics", "Other"];
const STAGES = [
  { value: "idea", label: "Idea" },
  { value: "validation", label: "MVP" },
  { value: "building", label: "Growing" },
];
const COMMITMENTS = ["Weekend", "Part-time", "Full-time"];
const PAY_TYPES = ["Paid", "Equity", "Volunteer", "Undecided"];

interface RoleRow {
  key: number;
  name: string;
  slots: number;
}

export default function NewIdeaForm() {
  const [isPending, startTransition] = useTransition();
  const [lookingForCollaborators, setLookingForCollaborators] = useState(false);
  const [roles, setRoles] = useState<RoleRow[]>([{ key: 0, name: "", slots: 1 }]);
  const [nextKey, setNextKey] = useState(1);
  const [stage, setStage] = useState("idea");
  const [commitment, setCommitment] = useState("Part-time");
  const [payType, setPayType] = useState("Undecided");
  const [remote, setRemote] = useState("Yes");

  function addRole() {
    setRoles((r) => [...r, { key: nextKey, name: "", slots: 1 }]);
    setNextKey((k) => k + 1);
  }

  function removeRole(key: number) {
    setRoles((r) => r.filter((role) => role.key !== key));
  }

  function updateRole(key: number, field: "name" | "slots", value: string | number) {
    setRoles((r) => r.map((role) => (role.key === key ? { ...role, [field]: value } : role)));
  }

  function handleSubmit(formData: FormData) {
    startTransition(() => createIdea(formData));
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-5">
      <input type="hidden" name="stage" value={stage} />

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Project Title</label>
        <input
          name="title"
          required
          placeholder="e.g. AI Study Assistant for Students"
          className="mt-1.5 w-full rounded-card border border-line-strong bg-surface px-4 py-3 text-[14px] text-ink placeholder:text-ink/35 shadow-card"
        />
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Description</label>
        <textarea
          name="description"
          required
          rows={4}
          placeholder="An AI app that helps students summarize notes, generate flashcards, and get personalized explanations."
          className="mt-1.5 w-full resize-none rounded-card border border-line-strong bg-surface px-4 py-3 text-[14px] text-ink placeholder:text-ink/35 shadow-card"
        />
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Category</label>
        <select name="category" className="mt-1.5 w-full rounded-card border border-line-strong bg-surface px-4 py-3 text-[14px] text-ink shadow-card">
          <option value="">Select a category</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Project Stage</label>
        <div className="mt-1.5 flex gap-2">
          {STAGES.map((s) => (
            <button
              type="button"
              key={s.value}
              onClick={() => setStage(s.value)}
              className={`flex-1 rounded-pill py-2.5 text-[13px] font-bold transition-colors ${
                stage === s.value ? "bg-aza text-white shadow-glow-accent" : "border border-line-strong bg-surface text-ink/55"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-card border border-line-strong bg-surface px-4 py-3.5 shadow-card">
        <div>
          <p className="text-[13.5px] font-bold text-ink">Looking for collaborators</p>
          <p className="mt-0.5 text-[11.5px] text-ink/50">Also list this in Team Finder</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={lookingForCollaborators}
          onClick={() => setLookingForCollaborators((v) => !v)}
          className={`relative h-7 w-12 shrink-0 rounded-pill transition-colors ${lookingForCollaborators ? "bg-aza" : "bg-paper-dim"}`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-card transition-transform ${
              lookingForCollaborators ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        {lookingForCollaborators && <input type="hidden" name="looking_for_collaborators" value="on" />}
      </div>

      {lookingForCollaborators && (
        <div className="space-y-4 rounded-card border border-line-strong bg-paper-dim/40 p-4">
          <div>
            <label className="text-[13px] font-semibold text-ink/70">Skills needed</label>
            <div className="mt-2 space-y-2">
              {roles.map((role) => (
                <div key={role.key} className="flex items-center gap-2">
                  <input
                    name="role_name[]"
                    value={role.name}
                    onChange={(e) => updateRole(role.key, "name", e.target.value)}
                    placeholder="e.g. Flutter Developer"
                    className="min-w-0 flex-1 rounded-card-sm border border-line-strong bg-surface px-3.5 py-2.5 text-[13px] text-ink placeholder:text-ink/35 shadow-card"
                  />
                  <input
                    name="slots_needed[]"
                    type="number"
                    min={1}
                    max={20}
                    value={role.slots}
                    onChange={(e) => updateRole(role.key, "slots", parseInt(e.target.value, 10) || 1)}
                    className="w-16 shrink-0 rounded-card-sm border border-line-strong bg-surface px-2 py-2.5 text-center text-[13px] text-ink shadow-card"
                  />
                  {roles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRole(role.key)}
                      aria-label="Remove role"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/35"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addRole}
              className="mt-2 flex items-center gap-1.5 text-[12.5px] font-bold text-aza"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              Add skill
            </button>
          </div>

          <div>
            <label className="text-[13px] font-semibold text-ink/70">Commitment</label>
            <div className="mt-1.5 flex gap-2">
              {COMMITMENTS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCommitment(c)}
                  className={`flex-1 rounded-pill py-2.5 text-[12.5px] font-bold ${
                    commitment === c ? "bg-aza text-white shadow-glow-accent" : "border border-line-strong bg-surface text-ink/55"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <input type="hidden" name="commitment" value={commitment} />
          </div>

          <div>
            <label className="text-[13px] font-semibold text-ink/70">Paid?</label>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {PAY_TYPES.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPayType(p)}
                  className={`rounded-pill py-2.5 text-[11.5px] font-bold ${
                    payType === p ? "bg-aza text-white shadow-glow-accent" : "border border-line-strong bg-surface text-ink/55"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input type="hidden" name="pay_type" value={payType} />
          </div>

          <div>
            <label className="text-[13px] font-semibold text-ink/70">Remote?</label>
            <div className="mt-1.5 flex gap-2">
              {["Yes", "No", "Flexible"].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRemote(r)}
                  className={`flex-1 rounded-pill py-2.5 text-[12.5px] font-bold ${
                    remote === r ? "bg-aza text-white shadow-glow-accent" : "border border-line-strong bg-surface text-ink/55"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <input type="hidden" name="remote_pref" value={remote} />
          </div>
        </div>
      )}

      <div>
        <label className="text-[13px] font-semibold text-ink/70">Visibility</label>
        <div className="mt-1.5 flex gap-2">
          <label className="flex flex-1 items-center justify-center gap-1.5 rounded-card border border-line-strong bg-surface py-2.5 text-[13px] font-medium text-ink shadow-card">
            <input type="radio" name="visibility" value="public" defaultChecked className="accent-aza" /> Public
          </label>
          <label className="flex flex-1 items-center justify-center gap-1.5 rounded-card border border-line-strong bg-surface py-2.5 text-[13px] font-medium text-ink shadow-card">
            <input type="radio" name="visibility" value="private" className="accent-aza" /> Private
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-card bg-aza py-3.5 text-[15px] font-bold text-white shadow-glow-accent disabled:opacity-60"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="m3 11 18-8-8 18-2-8-8-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        {isPending ? "Posting..." : "Publish Project"}
      </button>
    </form>
  );
}
