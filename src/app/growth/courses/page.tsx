"use client";

import { Clock } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, Pills } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";
import { courses } from "@/lib/aza-data";

const filters = ["All", "Design", "Coding", "Business", "AI"] as const;

export default function CoursesPage() {
  const [f, setF] = useState<(typeof filters)[number]>("All");
  const shown = courses.filter((c) => f === "All" || c.skill === f);

  return (
    <AppShell>
      <BackLink to="/growth" label="Growth" />
      <PageHeader title="Courses" sub="Picked for young founders" />
      <Pills options={filters} value={f} onChange={setF} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => (
          <a
            key={c.id}
            href="https://example.com"
            target="_blank"
            rel="noreferrer"
            className="card-lift flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-border-strong"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-primary-strong">
              {c.skill}
            </p>
            <h3 className="text-base font-display font-bold leading-snug text-foreground">
              {c.title}
            </h3>
            <p className="text-sm text-muted-foreground">{c.provider}</p>
            <div className="mt-auto flex gap-1.5">
              {c.free ? <Tag tone="primary">Free</Tag> : <Tag>Paid</Tag>}
              <Tag icon={<Clock className="size-3.5" />}>{c.hours}h</Tag>
            </div>
          </a>
        ))}
      </div>
    </AppShell>
  );
}
