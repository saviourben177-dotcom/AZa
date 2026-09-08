"use client";

// src/app/admin/teams/team-form.tsx
//
// Creates either a normal Idea post or a Team (idea + open roles),
// depending on the "This is a team looking for collaborators" checkbox.
// Both write to public.ideas the same way an organic post would — a normal
// Idea appears in the same Ideas feed as user-posted content, with the
// same interactions (upvotes, comments, saves), because nothing about the
// feed or those tables was touched.

import { useState } from "react";
import { createIdea } from "@/lib/actions/admin/teams";

type RoleRow = { role_name: string; slots_needed: number };

export function TeamForm({ defaultOwnerId }: { defaultOwnerId: string }) {
  const [isTeam, setIsTeam] = useState(false);
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
      // owner_profile_id must be either your own admin account or the
      // @Aza editorial profile id — see teams.ts for the exact RLS rule.
      await createIdea({
        title: String(formData.get("title")),
        description: String(formData.get("description")),
        category: (formData.get("category") as string) || null,
        stage: "idea",
        owner_profile_id: String(formData.get("owner_profile_id")),
        is_team: isTeam,
        roles: isTeam ? roles.filter((r) => r.role_name.trim().length > 0) : undefined,
      });
      setStatus("done");
      setRoles([{ role_name: "", slots_needed: 1 }]);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to create post");
    }
  }

  return (
    <form action={handleSubmit} className="grid max-w-xl gap-3 rounded-lg border border-neutral-200 bg-white p-4">
      <input name="title" placeholder="Idea title" required className="rounded border px-3 py-2" />
      <textarea
        name="description"
        placeholder="What's the idea?"
        required
        rows={4}
        className="rounded border px-3 py-2"
      />
      <input name="category" placeholder="Category (optional)" className="rounded border px-3 py-2" />
      <input
        name="owner_profile_id"
        defaultValue={defaultOwnerId}
        placeholder="Owner profile UUID — your admin account, or @Aza's editorial profile id"
        required
        className="rounded border px-3 py-2 font-mono text-sm"
      />
      <p className="-mt-2 text-xs text-neutral-400">
        Defaults to @Aza&apos;s editorial profile. Replace with your own admin
        account&apos;s UUID if you want a post owned by you instead.
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isTeam}
          onChange={(e) => setIsTeam(e.target.checked)}
        />
        This is a team looking for collaborators (adds open roles, shows up
        in Team Finder)
      </label>

      {isTeam && (
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
      )}

      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {status === "saving" ? "Creating…" : isTeam ? "Create team" : "Create idea"}
      </button>

      {status === "done" && (
        <p className="text-sm text-green-600">
          {isTeam ? "Team created with open roles." : "Idea posted to the feed."}
        </p>
      )}
      {status === "error" && <p className="text-sm text-red-600">{errorMsg}</p>}
    </form>
  );
}
