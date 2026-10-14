"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn } from "@/components/aza/kit";
import { TextField, TextArea, SelectField } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import { createIdea } from "@/lib/actions/ideas";

export default function NewIdeaPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const asks = [
    "Seeking Co-Founder",
    "Feedback Wanted",
    "Looking for Beta Testers",
    "Distribution Advice",
  ];
  const stages = ["Idea", "Validating", "Building", "Launched"];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    // Map prototype fields if needed
    if (!data.get("description") && data.get("pitch")) {
      data.set("description", data.get("pitch") as string);
    }
    const ask = data.get("ask");
    if (ask) {
      data.set("skills_needed", String(ask));
    }
    const stage = data.get("stage");
    if (stage) {
      data.set("category", String(stage));
    }

    startTransition(async () => {
      try {
        await createIdea(data);
        toast.success("Idea posted");
      } catch (err: unknown) {
        // Next.js redirect throws a digest error; let it propagate
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
      <BackLink to="/growth/ideas" label="Ideas" />
      <PageHeader title="Share an idea" sub="Be specific about what you need" />
      <div className="mx-auto max-w-xl">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border bg-card p-6 shadow-[var(--shadow-card)]"
        >
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

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push("/growth/ideas")}
              className={btn.ghost}
            >
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
