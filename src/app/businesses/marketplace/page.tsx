"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn, Pills } from "@/components/aza/kit";
import { AuthorLine, PageHeader, Tag } from "@/components/aza/ui";
import { listings as mockListings } from "@/lib/aza-data";

const types = ["All", "Sell", "Buy", "Service", "Collaborate"] as const;

export default function MarketplacePage() {
  const [t, setT] = useState<(typeof types)[number]>("All");

  const shown = mockListings.filter((l) => t === "All" || l.type === t);

  return (
    <AppShell>
      <BackLink to="/businesses" label="Business" />
      <PageHeader
        title="Marketplace"
        sub="Trade with founders near you"
        action={
          <Link href="/businesses/marketplace/new" className={btn.primary}>
            Post a listing
          </Link>
        }
      />
      <Pills options={types} value={t} onChange={setT} />
      <div className="grid gap-3 md:grid-cols-2">
        {shown.map((l) => (
          <article
            key={l.id}
            className="card-lift flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-border-strong"
          >
            <div className="flex items-center justify-between gap-2">
              <Tag
                tone={
                  l.type === "Sell"
                    ? "primary"
                    : l.type === "Collaborate"
                      ? "info"
                      : "neutral"
                }
              >
                {l.type}
              </Tag>
              {l.price && (
                <span className="tabular font-display font-extrabold text-foreground">
                  {l.price}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-foreground">{l.title}</h3>
            <p className="text-sm text-foreground/80">{l.body}</p>
            <div className="mt-auto pt-1">
              <AuthorLine id={l.author} hoursAgo={l.hoursAgo} />
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
