"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn } from "@/components/aza/kit";
import { TextField, TextArea, SelectField } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import { createIdea } from "@/lib/actions/ideas";

interface RoleRow {
  key: number;
  name: string;
  slots: number;
}

export default function NewIdeaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromTeamFinder = searchParams.get("team") === "1";

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [lookingForCollaborators, setLookingForCollaborators] = useState(fromTeamFinder);
  const [roles, setRoles] = useState<RoleRow[]>([{ key: 0, name: "", slots: 1 }]);
  const [nextKey, setNextKey] = useState(1);

  const asks = ["Seeking Co-Founder", "Feedback Wanted", "Looking for Beta Testers", "Distribution Advice"];
  const stages = ["Idea", "Validating", "Building", "Launched"];
  const backHref = fromTeamFinder ? "/businesses/team-finder" : "/growth/ideas";

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    if (!data.get("description") && data.get("pitch")) {
      data.set("description", data.get("pitch") as string);
    }
    const ask = data.get("ask");
    if (ask) data.set("skills_needed", String(ask));
    const stage = data.get("stage");
    if (stage) data.set("category", String(stage));

    if (lookingForCollaborators) {
      data.set("looking_for_collaborators", "on");
      roles
        .filter((r) => r.name.trim().length > 0)
        .forEach((r) => {
          data.append("role_name[]", r.name);
          data.append("slots_needed[]", String(r.slots));
        });
    }

    startTransition(async () => {
      try {
        await createIdea(data);
        toast.success("Idea posted");
      } catch (err: unknown) {
        if (err && typeof err === "object" && "digest" in err) {
          throw err;
        }
        const message = err instanceof Error ? err.message : "Failed to post idea";
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <AppShell>
      <BackLink to={backHref} label={fromTeamFinder ? "Team Finder" : "Ideas"} />
      <PageHeader
        title={fromTeamFinder ? "Post a Team Project" : "Share an idea"}
        sub={fromTeamFinder ? "Post it here and find collaborators to join you." : "Be specific about what you need"}
      />
      <div className="mx-auto max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-6 shadow-[var(--shadow-card)]">
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <TextField label="Title" name="title" required />
          <SelectField label="The Ask" name="ask" options={asks} />
          <SelectField label="Stage" name="stage" options={stages} />
          <TextArea label="Pitch" name="pitch" rows={6} required />

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Optional Website or Demo Link
            </label>
            <input
              name="link_url"
              type="url"
              placeholder="https://..."
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={lookingForCollaborators}
              onChange={(e) => setLookingForCollaborators(e.target.checked)}
              className="size-4 accent-[var(--color-primary)]"
            />
            Looking for collaborators
          </label>

          {lookingForCollaborators && (
            <div className="space-y-2 rounded-md border border-dashed p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Roles needed</p>
              {roles.map((role) => (
                <div key={role.key} className="flex gap-2">
                  <input
                    value={role.name}
                    onChange={(e) => updateRole(role.key, "name", e.target.value)}
                    placeholder="e.g. Frontend developer"
                    className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={role.slots}
                    onChange={(e) => updateRole(role.key, "slots", parseInt(e.target.value, 10) || 1)}
                    className="h-10 w-16 rounded-md border border-input bg-background px-2 text-sm"
                  />
                  {roles.length > 1 && (
                    <button type="button" onClick={() => removeRole(role.key)} className={btn.ghost}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addRole} className={btn.secondary}>
                + Add role
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => router.push(backHref)} className={btn.ghost}>
              Cancel
            </button>
            <button type="submit" disabled={isPending} className={btn.primary}>
              {isPending ? "Posting…" : "Post idea"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
