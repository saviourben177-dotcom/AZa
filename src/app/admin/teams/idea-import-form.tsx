"use client";

// src/app/admin/teams/idea-import-form.tsx
//
// Bulk import for normal Idea posts AND Teams together, via CSV or JSON.
// CSV supports flat Idea rows only (no roles — CSV has no clean way to
// express a nested array per row). Use JSON if any row needs is_team=true
// with roles. See teams.ts for the exact schema and this constraint.

import { useState } from "react";
import {
  previewIdeaImport,
  commitIdeaImport,
  type BulkIdeaRow,
} from "@/lib/actions/admin/teams";
import type { ImportPreview } from "@/lib/actions/admin/import";

export function IdeaImportForm({ defaultOwnerId }: { defaultOwnerId: string }) {
  const [preview, setPreview] = useState<ImportPreview<BulkIdeaRow> | null>(null);
  const [status, setStatus] = useState<"idle" | "previewing" | "committing" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("previewing");
    setErrorMsg("");
    try {
      const text = await file.text();
      const format = file.name.endsWith(".json") ? "json" : "csv";
      const result = await previewIdeaImport(text, format);
      setPreview(result);
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
      await commitIdeaImport(validRows, defaultOwnerId);
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
        CSV columns: <code>title, description, category, tags, stage, is_team</code>{" "}
        (tags as comma-separated values, e.g. <code>fintech,agritech</code>).
        CSV rows are always plain Ideas unless <code>is_team</code> is{" "}
        <code>true</code> — but CSV cannot carry open roles, so a team row in
        CSV will fail validation with a clear message telling you to use
        JSON instead. For teams with roles, upload a JSON array where each
        object may include <code>&quot;is_team&quot;: true</code> and{" "}
        <code>&quot;roles&quot;: [{"{"}"role_name": "...", "slots_needed": 1{"}"}]</code>.
      </p>

      <input type="file" accept=".csv,.json" onChange={handleFile} className="mb-4" />

      {preview && (
        <div className="space-y-3">
          <p className="text-sm">
            <span className="text-green-600">{preview.validCount} valid</span>
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
                      Row {r.index + 1}: {r.errors.join("; ")}
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
              : `Import ${preview.validCount} valid row(s)`}
          </button>
        </div>
      )}

      {status === "done" && <p className="mt-2 text-sm text-green-600">Import complete.</p>}
      {status === "error" && <p className="mt-2 text-sm text-red-600">{errorMsg}</p>}
    </div>
  );
}
