"use client";

// src/app/admin/teams/team-form.tsx

import { useState } from "react";
import { createTeam } from "@/lib/actions/admin/teams";

type RoleRow = { role_name: string; slots_needed: number };

export function TeamForm() {
  const [roles, setRoles] = useState<RoleRow[]>([{ role_name: "", slots_needed: 1 }]);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function updateRole(index: number, field: keyof RoleRow, value: string) {
    setRoles((prev) =>
      prev.map((r, i) =>
        i === index
          ? { ...r, [field]: field === "slots_needed" ? Number(value) || 1 : value }
          : r
      )
    );
  }

  async function handleSubmit(formData: FormData) {
    setStatus("saving");
    setErrorMsg("");
    try {
      // NOTE: owner_profile_id must currently be the admin's own account —
      // see teams.ts for why (ideas' RLS is owner-only insert, unchanged
      // from the original architecture on purpose).
      await createTeam({
        title: String(formData.get("title")),
        description: String(formData.get("description")),
        category: (formData.get("category") as string) || null,
        stage: "idea",
        owner_profile_id: String(formData.get("owner_profile_id")),
        roles: roles.filter((r) => r.role_name.trim().length > 0),
      });
      setStatus("done");
      setRoles([{ role_name: "", slots_needed: 1 }]);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to create team");
    }
  }

  return (
    <form action={handleSubmit} className="grid max-w-xl gap-3 rounded-lg border border-neutral-200 bg-white p-4">
      <input name="title" placeholder="Team / project title" required className="rounded border px-3 py-2" />
      <textarea
        name="description"
        placeholder="What is this team building?"
        required
        rows={4}
        className="rounded border px-3 py-2"
      />
      <input name="category" placeholder="Category (optional)" className="rounded border px-3 py-2" />
      <input
        name="owner_profile_id"
        placeholder="Owner profile UUID (your own admin account id)"
        required
        className="rounded border px-3 py-2 font-mono text-sm"
      />

      <div>
        <p className="mb-2 text-sm font-medium">Open roles</p>
        {roles.map((role, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input
              value={role.role_name}
              onChange={(e) => updateRole(i, "role_name", e.target.value)}
              placeholder="Role name (e.g. Flutter Developer)"
              className="flex-1 rounded border px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={1}
              max={20}
              value={role.slots_needed}
              onChange={(e) => updateRole(i, "slots_needed", e.target.value)}
              className="w-20 rounded border px-3 py-2 text-sm"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRoles((prev) => [...prev, { role_name: "", slots_needed: 1 }])}
          className="text-sm text-neutral-500 underline"
        >
          + add another role
        </button>
      </div>

      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {status === "saving" ? "Creating…" : "Create team"}
      </button>

      {status === "done" && <p className="text-sm text-green-600">Team created with open roles.</p>}
      {status === "error" && <p className="text-sm text-red-600">{errorMsg}</p>}
    </form>
  );
}
