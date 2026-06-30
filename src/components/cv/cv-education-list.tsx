"use client";

import { useState, useTransition } from "react";
import { upsertEducationEntry, removeEducationEntry } from "@/lib/actions/cv-profile";
import type { EducationEntry } from "@/lib/cv-types";

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyEntry(): EducationEntry {
  return { id: newId(), institution: "", qualification: "", field_of_study: "", start_year: "", end_year: "", grade: "" };
}

export default function CvEducationList({ entries }: { entries: EducationEntry[] }) {
  const [list, setList] = useState<EducationEntry[]>(entries);
  const [editing, setEditing] = useState<EducationEntry | null>(null);
  const [isPending, startTransition] = useTransition();

  function startNew() {
    setEditing(emptyEntry());
  }

  function save(entry: EducationEntry) {
    const next = list.some((e) => e.id === entry.id)
      ? list.map((e) => (e.id === entry.id ? entry : e))
      : [...list, entry];
    setList(next);
    setEditing(null);
    startTransition(() => upsertEducationEntry(entry));
  }

  function remove(id: string) {
    setList(list.filter((e) => e.id !== id));
    startTransition(() => removeEducationEntry(id));
  }

  return (
    <div className="mt-2.5 space-y-2.5">
      {list.map((entry) => (
        <div key={entry.id} className="rounded-card border border-line bg-surface p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[13.5px] font-bold text-ink">{entry.qualification || "Untitled qualification"}</p>
              <p className="text-[12.5px] text-ink/60">{entry.institution}</p>
              {(entry.start_year || entry.end_year) && (
                <p className="mt-0.5 text-[11.5px] text-ink/45">{entry.start_year} – {entry.end_year || "Present"}</p>
              )}
            </div>
            <div className="flex shrink-0 gap-3">
              <button onClick={() => setEditing(entry)} className="text-[12px] font-semibold text-aza">Edit</button>
              <button onClick={() => remove(entry.id)} className="text-[12px] font-semibold text-danger">Remove</button>
            </div>
          </div>
        </div>
      ))}

      {list.length === 0 && !editing && <p className="text-[12px] text-ink/45">No education added yet.</p>}

      {editing ? (
        <EducationForm entry={editing} onSave={save} onCancel={() => setEditing(null)} isPending={isPending} />
      ) : (
        <button onClick={startNew} className="rounded-card border border-dashed border-line px-4 py-2.5 text-[12.5px] font-bold text-ink/60">
          + Add education
        </button>
      )}
    </div>
  );
}

function EducationForm({
  entry,
  onSave,
  onCancel,
  isPending,
}: {
  entry: EducationEntry;
  onSave: (e: EducationEntry) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [draft, setDraft] = useState<EducationEntry>(entry);

  return (
    <div className="rounded-card border border-line bg-surface p-3.5">
      <div className="space-y-2.5">
        <Field label="Institution" value={draft.institution} onChange={(v) => setDraft({ ...draft, institution: v })} />
        <Field label="Qualification" value={draft.qualification} onChange={(v) => setDraft({ ...draft, qualification: v })} />
        <Field label="Field of study (optional)" value={draft.field_of_study ?? ""} onChange={(v) => setDraft({ ...draft, field_of_study: v })} />
        <div className="flex gap-2">
          <Field label="Start year" value={draft.start_year ?? ""} onChange={(v) => setDraft({ ...draft, start_year: v })} />
          <Field label="End year" value={draft.end_year ?? ""} onChange={(v) => setDraft({ ...draft, end_year: v })} />
        </div>
        <Field label="Grade (optional)" value={draft.grade ?? ""} onChange={(v) => setDraft({ ...draft, grade: v })} />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onSave(draft)}
          disabled={isPending || !draft.institution || !draft.qualification}
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
