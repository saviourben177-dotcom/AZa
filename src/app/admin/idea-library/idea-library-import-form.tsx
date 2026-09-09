"use client";

// src/app/admin/idea-library/idea-library-import-form.tsx
// Same pattern as business-import-form.tsx — parse+validate first, commit only on confirm.

import { useState } from "react";
import { previewIdeaLibraryImport, commitIdeaLibraryImport } from "@/lib/actions/admin/idea-library";
import type { IdeaLibraryInput } from "@/lib/actions/admin/idea-library-schema";
import type { ImportPreview } from "@/lib/actions/admin/import";

export function IdeaLibraryImportForm({ defaultOwnerId }: { defaultOwnerId: string }) {
  const [preview, setPreview] = useState<ImportPreview<IdeaLibraryInput> | null>(null);
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
      const result = await previewIdeaLibraryImport(text, format);
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
      await commitIdeaLibraryImport(validRows, defaultOwnerId);
      setStatus("done");
      setPreview(null);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Import failed");
    }
  }

  return (
    <div className="max-w-2xl rounded-lg border border-neutral-200 bg-white p-4">
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
