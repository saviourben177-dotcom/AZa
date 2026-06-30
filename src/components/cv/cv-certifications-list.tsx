"use client";

import { useState, useTransition } from "react";
import { upsertCertificationEntry, removeCertificationEntry } from "@/lib/actions/cv-profile";
import type { CertificationEntry } from "@/lib/cv-types";

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyEntry(): CertificationEntry {
  return { id: newId(), name: "", issuer: "", year: "" };
}

export default function CvCertificationsList({ entries }: { entries: CertificationEntry[] }) {
  const [list, setList] = useState<CertificationEntry[]>(entries);
  const [editing, setEditing] = useState<CertificationEntry | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(entry: CertificationEntry) {
    const next = list.some((e) => e.id === entry.id)
      ? list.map((e) => (e.id === entry.id ? entry : e))
      : [...list, entry];
    setList(next);
    setEditing(null);
    startTransition(() => upsertCertificationEntry(entry));
  }

  function remove(id: string) {
    setList(list.filter((e) => e.id !== id));
    startTransition(() => removeCertificationEntry(id));
  }

  return (
    <div className="mt-2.5 space-y-2.5">
      {list.map((entry) => (
        <div key={entry.id} className="rounded-card border border-line bg-surface p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[13.5px] font-bold text-ink">{entry.name || "Untitled certification"}</p>
              <p className="text-[12.5px] text-ink/60">{entry.issuer}{entry.year ? ` · ${entry.year}` : ""}</p>
            </div>
            <div className="flex shrink-0 gap-3">
              <button onClick={() => setEditing(entry)} className="text-[12px] font-semibold text-aza">Edit</button>
              <button onClick={() => remove(entry.id)} className="text-[12px] font-semibold text-danger">Remove</button>
            </div>
          </div>
        </div>
      ))}

      {list.length === 0 && !editing && <p className="text-[12px] text-ink/45">No certifications added yet.</p>}

      {editing ? (
        <CertificationForm entry={editing} onSave={save} onCancel={() => setEditing(null)} isPending={isPending} />
      ) : (
        <button onClick={() => setEditing(emptyEntry())} className="rounded-card border border-dashed border-line px-4 py-2.5 text-[12.5px] font-bold text-ink/60">
          + Add certification
        </button>
      )}
    </div>
  );
}

function CertificationForm({
  entry,
  onSave,
  onCancel,
  isPending,
}: {
  entry: CertificationEntry;
  onSave: (e: CertificationEntry) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [draft, setDraft] = useState<CertificationEntry>(entry);

  return (
    <div className="rounded-card border border-line bg-surface p-3.5">
      <div className="space-y-2.5">
        <Field label="Certification name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
        <Field label="Issuer (optional)" value={draft.issuer ?? ""} onChange={(v) => setDraft({ ...draft, issuer: v })} />
        <Field label="Year (optional)" value={draft.year ?? ""} onChange={(v) => setDraft({ ...draft, year: v })} />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onSave(draft)}
          disabled={isPending || !draft.name}
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
