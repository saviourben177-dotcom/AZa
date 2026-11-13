"use client";

// src/app/admin/skills/skill-path-import-form.tsx
//
// Two-step flow: parse+validate (no DB writes) -> review -> commit.
// JSON only (see skill-paths.ts preview action for why: nested checkpoints
// don't have a sane flat CSV shape). Each valid path upserts by its own
// `slug`, and each of its checkpoints upserts by (path, order) — so
// dropping in a corrected file for a path you already imported updates it
// in place instead of duplicating rows. Invalid rows are shown with their
// specific error and excluded from commit; they never block valid rows in
// the same file.

import { useState } from "react";
import { previewSkillPathImport, commitSkillPathImport } from "@/lib/actions/admin/skill-paths";
import type { SkillPathInput } from "@/lib/actions/admin/skill-path-schema";
import type { ImportPreview } from "@/lib/actions/admin/import";

export function SkillPathImportForm({ defaultOwnerId }: { defaultOwnerId: string }) {
  const [preview, setPreview] = useState<ImportPreview<SkillPathInput> | null>(null);
  const [status, setStatus] = useState<"idle" | "previewing" | "committing" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ pathsWritten: number; checkpointsWritten: number } | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("previewing");
    setErrorMsg("");
    setResult(null);
    try {
      const text = await file.text();
      if (!file.name.endsWith(".json")) {
        throw new Error("Skill path import only accepts .json files (nested checkpoints don't fit CSV).");
      }
      const preview = await previewSkillPathImport(text);
      setPreview(preview);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to parse file");
    }
  }

  async function handleCommit() {
    if (!preview) return;
    setStatus("committing");
    try {
      const validRows = preview.rows
        .filter((r): r is Extract<typeof r, { status: "valid" }> => r.status === "valid")
        .map((r) => r.data);
      const outcome = await commitSkillPathImport(validRows, defaultOwnerId);
      setResult(outcome);
      setStatus("done");
      setPreview(null);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Import failed");
    }
  }

  return (
    <div className="max-w-2xl rounded-lg border border-neutral-200 bg-white p-4">
      <p className="mb-3 text-xs text-neutral-500">
        Each path in the file is matched by its <code>slug</code> — importing a slug that already
        exists updates that path and its checkpoints in place, rather than creating a duplicate.
        Each checkpoint is matched the same way by its <code>order</code> number within the path.
      </p>
      <input type="file" accept=".json" onChange={handleFile} className="mb-4" />

      {preview && (
        <div className="space-y-3">
          <p className="text-sm">
            <span className="text-green-600">{preview.validCount} valid path(s)</span>
            {" · "}
            <span className="text-red-600">{preview.invalidCount} invalid</span>
          </p>

          {preview.invalidCount > 0 && (
            <ul className="max-h-40 space-y-1 overflow-y-auto rounded border border-red-100 bg-red-50 p-2 text-xs">
              {preview.rows
                .filter((r) => r.status === "invalid")
                .map((r) =>
                  r.status === "invalid" ? (
                    <li key={r.index}>
                      Path {r.index + 1}: {r.errors.join("; ")}
                    </li>
                  ) : null
                )}
            </ul>
          )}

          <button
            onClick={handleCommit}
            disabled={preview.validCount === 0 || status === "committing"}
            className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {status === "committing"
              ? "Importing…"
              : `Import ${preview.validCount} valid path(s)`}
          </button>
        </div>
      )}

      {status === "done" && result && (
        <p className="mt-2 text-sm text-green-600">
          Import complete — {result.pathsWritten} path(s), {result.checkpointsWritten} checkpoint(s) written.
        </p>
      )}
      {status === "error" && <p className="mt-2 text-sm text-red-600">{errorMsg}</p>}
    </div>
  );
}
