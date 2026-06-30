"use client";

import { useState, useTransition } from "react";
import { upsertExperienceEntry, removeExperienceEntry } from "@/lib/actions/cv-profile";
import type { ExperienceEntry } from "@/lib/cv-types";

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyEntry(): ExperienceEntry {
  return { id: newId(), organization: "", role: "", start_date: "", end_date: "", is_current: false, description: "" };
}

export default function CvExperienceList({ entries }: { entries: ExperienceEntry[] }) {
  const [list, setList] = useState<ExperienceEntry[]>(entries);
  const [editing, setEditing] = useState<ExperienceEntry | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(entry: ExperienceEntry) {
    const next = list.some((e) => e.id === entry.id)
      ? list.map((e) => (e.id === entry.id ? entry : e))
      : [...list, entry];
    setList(next);
    setEditing(null);
    startTransition(() => upsertExperienceEntry(entry));
  }

  function remove(id: string) {
    setList(list.filter((e) => e.id !== id));
    startTransition(() => removeExperienceEntry(id));
  }

  return (
    <div className="mt-2.5 space-y-2.5">
      {list.map((entry) => (
        <div key={entry.id} className="rounded-card border border-line bg-surface p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[13.5px] font-bold text-ink">{entry.role || "Untitled role"}</p>
              <p className="text-[12.5px] text-ink/60">{entry.organization}</p>
              <p className="mt-0.5 text-[11.5px] text-ink/45">
                {entry.start_date} – {entry.is_current ? "Present" : entry.end_date || ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <button onClick={() => setEditing(entry)} className="text-[12px] font-semibold text-aza">Edit</button>
              <button onClick={() => remove(entry.id)} className="text-[12px] font-semibold text-danger">Remove</button>
            </div>
          </div>
        </div>
      ))}

      {list.length === 0 && !editing && <p className="text-[12px] text-ink/45">No experience added yet.</p>}

      {editing ? (
        <ExperienceForm entry={editing} onSave={save} onCancel={() => setEditing(null)} isPending={isPending} />
      ) : (
        <button onClick={() => setEditing(emptyEntry())} className="rounded-card border border-dashed border-line px-4 py-2.5 text-[12.5px] font-bold text-ink/60">
          + Add experience
        </button>
      )}
    </div>
  );
}

function ExperienceForm({
  entry,
  onSave,
  onCancel,
  isPending,
}: {
  entry: ExperienceEntry;
  onSave: (e: ExperienceEntry) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [draft, setDraft] = useState<ExperienceEntry>(entry);

  return (
    <div className="rounded-card border border-line bg-surface p-3.5">
      <div className="space-y-2.5">
        <Field label="Organization" value={draft.organization} onChange={(v) => setDraft({ ...draft, organization: v })} />
        <Field label="Role" value={draft.role} onChange={(v) => setDraft({ ...draft, role: v })} />
        <div className="flex gap-2">
          <Field label="Start date" value={draft.start_date ?? ""} onChange={(v) => setDraft({ ...draft, start_date: v })} />
          <Field
            label="End date"
            value={draft.is_current ? "" : draft.end_date ?? ""}
            onChange={(v) => setDraft({ ...draft, end_date: v })}
          />
        </div>
        <label className="flex items-center gap-2 text-[12.5px] font-medium text-ink/70">
          <input
            type="checkbox"
            checked={draft.is_current}
            onChange={(e) => setDraft({ ...draft, is_current: e.target.checked })}
          />
          I currently work here
        </label>
        <div>
          <label className="text-[11.5px] font-semibold text-ink/60">Description (optional)</label>
          <textarea
            value={draft.description ?? ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={3}
            placeholder="What did you do/achieve in this role?"
            className="mt-1 w-full rounded-card border border-line bg-paper px-3 py-2 text-[13.5px]"
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onSave(draft)}
          disabled={isPending || !draft.organization || !draft.role}
          className="rounded-card bg-aza px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-50"
        >
          Save
        </button>
        <button onClick={onCancel} className="rounded-card bg-paper-dim px-4 py-2 text-[12.5px] font-bold text-ink/60">
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex-1">
      <label className="text-[11.5px] font-semibold text-ink/60">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-card border border-line bg-paper px-3 py-2 text-[13.5px]"
      />
    </div>
  );
}
