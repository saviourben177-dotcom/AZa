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
import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/aza/app-shell";
import { Tile } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";
import { cn } from "@/lib/utils";

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

const rates: Record<string, number> = {
  NGN: 1,
  USD: 1540,
  GBP: 1960,
  EUR: 1680,
  GHS: 102,
  KES: 11.9,
};

function Currency() {
  const [amt, setAmt] = useState(100);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("NGN");
  const out = (amt * (rates[from] ?? 1)) / (rates[to] ?? 1);
  const sel = "h-11 rounded-md border border-input bg-background px-3 text-sm text-foreground";

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
            {Object.keys(rates).map((c) => (
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
          {Object.keys(rates).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <div className="rounded-lg border bg-muted/60 p-5 shadow-[var(--shadow-card)]">
        <p className="tabular font-display text-3xl font-semibold text-foreground">
          {out.toLocaleString(undefined, { maximumFractionDigits: 2 })} {to}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Sample rates for preview only</p>
      </div>
    </div>
  );
}

const teams = [
  {
    name: "Cold-chain for tomato farmers",
    need: "Backend developer",
    where: "Enugu · Hybrid",
    members: 2,
  },
  {
    name: "WhatsApp JAMB tutor",
    need: "Content writer (Maths)",
    where: "Remote",
    members: 1,
  },
  { name: "Street diesel sharing", need: "Field sales lead", where: "Accra", members: 3 },
];

function Team() {
  return (
    <ul className="divide-y rounded-lg border bg-card">
      {teams.map((t) => (
        <li
          key={t.name}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4"
        >
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{t.name}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Tag tone="primary">Needs: {t.need}</Tag>
              <Tag>{t.where}</Tag>
              <Tag>{t.members} on team</Tag>
            </div>
          </div>
          <Link
            href="/businesses/team-finder"
            className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-semibold text-foreground hover:bg-accent"
          >
            Request to join
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Listings() {
  const items = [
    ["Mama Nkechi's Kitchen", "Food · Yaba"],
    ["Bright Solar Supplies", "Fuel & energy · Ikeja"],
    ["Danjuma Blocks", "Building materials · Kaduna"],
  ];
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map(([n, m]) => (
        <li key={n} className="rounded-lg border bg-card p-4">
          <p className="font-semibold text-foreground">{n}</p>
          <p className="text-sm text-muted-foreground">{m}</p>
        </li>
      ))}
    </ul>
  );
}
