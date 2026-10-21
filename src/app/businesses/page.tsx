"use client";

import {
  ArrowLeftRight,
  Building2,
  Calculator,
  FileText,
  Landmark,
  Rocket,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/aza/app-shell";
import { Tile } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const sections = [
  { id: "breakeven", label: "Break-even", icon: Calculator },
  { id: "currency", label: "Currency", icon: ArrowLeftRight },
  { id: "team", label: "Team Finder", icon: Users },
  { id: "listings", label: "Listings", icon: Store },
] as const;

type S = (typeof sections)[number]["id"];

export default function BusinessPage() {
  const [s, setS] = useState<S>("breakeven");

  return (
    <AppShell>
      <PageHeader title="Business" sub="Tools you'll use every week" />
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Tile to="/businesses/directory" icon={Building2} title="Directory" sub="Local businesses" />
        <Tile to="/businesses/marketplace" icon={ShoppingBag} title="Marketplace" sub="Buy, sell, collaborate" />
        <Tile to="/businesses/team-finder" icon={Users} title="Team Finder" sub="Join or build a team" />
        <Tile to="/businesses/funding" icon={Landmark} title="Funding" sub="Loans, grants, equity" />
        <Tile to="/businesses/incubators" icon={Rocket} title="Incubators" sub="Programmes near you" />
        <Tile to="/businesses/plan" icon={FileText} title="Business plan" sub="Generate a draft" />
      </div>

      <div
        role="tablist"
        className="sticky top-0 z-20 -mx-4 mb-6 flex gap-1 overflow-x-auto border-b bg-background px-4 md:top-16 md:mx-0 md:px-0"
      >
        {sections.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={s === t.id}
            onClick={() => setS(t.id)}
            className={cn(
              "-mb-px inline-flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors",
              s === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl">
        {s === "breakeven" && <BreakEven />}
        {s === "currency" && <Currency />}
        {s === "team" && <Team />}
        {s === "listings" && <Listings />}
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <div className="relative mt-1.5">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="tabular h-11 w-full rounded-md border border-input bg-background px-3 pr-12 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function BreakEven() {
  const [fixed, setFixed] = useState(150000);
  const [price, setPrice] = useState(2500);
  const [cost, setCost] = useState(1400);
  const margin = price - cost;
  const units = margin > 0 ? Math.ceil(fixed / margin) : null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <Field label="Monthly fixed costs" value={fixed} onChange={setFixed} suffix="₦" />
        <Field label="Selling price per unit" value={price} onChange={setPrice} suffix="₦" />
        <Field label="Cost per unit" value={cost} onChange={setCost} suffix="₦" />
      </div>
      <div className="rounded-lg border bg-muted/60 p-5 shadow-[var(--shadow-card)]">
        <p className="text-sm text-muted-foreground">You break even at</p>
        <p className="tabular mt-1 font-display text-4xl font-semibold text-foreground">
          {units ? units.toLocaleString() : "—"}
        </p>
        <p className="text-sm text-muted-foreground">units a month</p>
        {units && (
          <p className="mt-4 text-sm text-foreground">
            That&apos;s about <strong className="tabular font-bold">{Math.ceil(units / 26)}</strong>{" "}
            sales per working day, earning{" "}
            <strong className="tabular font-bold">₦{margin.toLocaleString()}</strong> margin each.
          </p>
        )}
        {!units && (
          <p className="mt-4 text-sm text-destructive">
            Your price must be higher than your unit cost.
          </p>
        )}
      </div>
    </div>
  );
}

// Currencies offered in the picker. Real rates for all of these are fetched
// live from Frankfurter (api.frankfurter.dev) — free, no API key, sourced
// from ~100 central banks and official sources, NGN included.
const CURRENCY_CODES = ["NGN", "USD", "GBP", "EUR", "GHS", "KES"];

function Currency() {
  const [amt, setAmt] = useState(100);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("NGN");
  const [rate, setRate] = useState<number | null>(null);
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const sel = "h-11 rounded-md border border-input bg-background px-3 text-sm text-foreground";

  useEffect(() => {
    if (from === to) {
      setRate(1);
      setRateDate(null);
      setStatus("idle");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    fetch(`https://api.frankfurter.dev/v2/rate/${from.toLowerCase()}/${to.toLowerCase()}`)
      .then((res) => {
        if (!res.ok) throw new Error("rate lookup failed");
        return res.json();
      })
      .then((data: { rate: number; date: string }) => {
        if (cancelled) return;
        setRate(data.rate);
        setRateDate(data.date);
        setStatus("idle");
      })
      .catch(() => {
        if (cancelled) return;
        setRate(null);
        setRateDate(null);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const out = rate !== null ? amt * rate : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Field label="Amount" value={amt} onChange={setAmt} />
        <label className="text-sm">
          <span className="font-medium text-foreground">From</span>
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={cn(sel, "mt-1.5 block")}
          >
            {CURRENCY_CODES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium text-foreground">To</span>
        <select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className={cn(sel, "mt-1.5 block w-full")}
        >
          {CURRENCY_CODES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <div className="rounded-lg border bg-muted/60 p-5 shadow-[var(--shadow-card)]">
        {status === "loading" && (
          <p className="tabular font-display text-2xl font-semibold text-muted-foreground">
            Loading rate…
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-destructive">
            Couldn&apos;t fetch a live rate right now. Try again in a moment.
          </p>
        )}
        {status === "idle" && out !== null && (
          <>
            <p className="tabular font-display text-3xl font-semibold text-foreground">
              {out.toLocaleString(undefined, { maximumFractionDigits: 2 })} {to}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {rateDate ? `Live rate as of ${rateDate}` : "Same currency"} · via Frankfurter
            </p>
          </>
        )}
      </div>
    </div>
  );
}

interface IdeaRole {
  role_name: string;
  slots_needed: number;
  slots_filled: number;
}

interface TeamIdea {
  id: string;
  title: string;
  idea_roles: IdeaRole[];
}

function Team() {
  const [ideas, setIdeas] = useState<TeamIdea[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("ideas")
      .select("id, title, idea_roles(role_name, slots_needed, slots_filled)")
      .eq("looking_for_collaborators", true)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (!cancelled) setIdeas((data as unknown as TeamIdea[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (ideas === null) {
    return <p className="p-4 text-sm text-muted-foreground">Loading teams…</p>;
  }

  if (ideas.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="font-semibold text-foreground">No open teams right now</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Check back soon, or post your own project to find collaborators.
        </p>
        <Link
          href="/growth/ideas/new?team=1"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Post a project
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-lg border bg-card">
      {ideas.map((idea) => {
        const roles = idea.idea_roles ?? [];
        const openRoles = roles.filter((r) => r.slots_filled < r.slots_needed);
        const totalMembersNeeded = roles.reduce((sum, r) => sum + r.slots_needed, 0);
        return (
          <li key={idea.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4">
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{idea.title}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {openRoles.length > 0 ? (
                  openRoles.map((r) => (
                    <Tag key={r.role_name} tone="primary">
                      Needs: {r.role_name}
                    </Tag>
                  ))
                ) : (
                  <Tag>Team full</Tag>
                )}
                <Tag>
                  {totalMembersNeeded} {totalMembersNeeded === 1 ? "spot" : "spots"}
                </Tag>
              </div>
            </div>
            <Link
              href={`/businesses/team-finder/${idea.id}`}
              className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-semibold text-foreground hover:bg-accent"
            >
              View
            </Link>
          </li>
        );
      })}
      <li className="p-3 text-center">
        <Link href="/businesses/team-finder" className="text-sm font-semibold text-primary-strong">
          See all teams →
        </Link>
      </li>
    </ul>
  );
}

interface DbBusiness {
  id: string;
  name: string;
  category: string | null;
  location: string | null;
}

function Listings() {
  const [businesses, setBusinesses] = useState<DbBusiness[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("businesses")
      .select("id, name, category, location")
      .order("name")
      .limit(5)
      .then(({ data }) => {
        if (!cancelled) setBusinesses(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (businesses === null) {
    return <p className="p-4 text-sm text-muted-foreground">Loading listings…</p>;
  }

  if (businesses.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="font-semibold text-foreground">No businesses listed yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Be the first to add yours to the directory.</p>
        <Link
          href="/businesses/directory/new"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          List yours
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {businesses.map((b) => (
        <Link
          key={b.id}
          href={`/businesses/directory/${b.id}`}
          className="rounded-lg border bg-card p-4 transition-colors hover:border-border-strong"
        >
          <p className="font-semibold text-foreground">{b.name}</p>
          <p className="text-sm text-muted-foreground">
            {[b.category, b.location].filter(Boolean).join(" · ")}
          </p>
        </Link>
      ))}
      <li className="col-span-full p-1 text-center">
        <Link href="/businesses/directory" className="text-sm font-semibold text-primary-strong">
          See all businesses →
        </Link>
      </li>
    </ul>
  );
}
