"use client";

// src/app/admin/idea-library/idea-library-form.tsx

import { useState } from "react";
import { createIdeaLibraryEntry } from "@/lib/actions/admin/idea-library";

export function IdeaLibraryForm({ defaultOwnerId }: { defaultOwnerId: string }) {
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(formData: FormData) {
    setStatus("saving");
    setErrorMsg("");
    try {
      await createIdeaLibraryEntry(
        {
          title: String(formData.get("title")),
          category: String(formData.get("category")),
          summary: (formData.get("summary") as string) || null,
          description: String(formData.get("description")),
        },
        defaultOwnerId
      );
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to create entry");
    }
  }

  return (
    <form
      action={handleSubmit}
      className="grid max-w-xl gap-3 rounded-lg border border-neutral-200 bg-white p-4"
    >
      <input name="title" placeholder="Title" required className="rounded border px-3 py-2" />
      <input name="category" placeholder="Category" required className="rounded border px-3 py-2" />
      <input name="summary" placeholder="Summary (max 500 chars)" className="rounded border px-3 py-2" />
      <textarea
        name="description"
        placeholder="Full description"
        required
        rows={6}
        className="rounded border px-3 py-2"
      />

      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Create entry"}
      </button>

      {status === "done" && <p className="text-sm text-green-600">Created.</p>}
      {status === "error" && <p className="text-sm text-red-600">{errorMsg}</p>}
    </form>
  );
}
