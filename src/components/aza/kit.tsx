// Presentational building blocks for secondary screens.
// Everything is props-driven so it can be wired to real data/actions later.
import Link from "next/link";
import { ArrowLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export const btn = {
  primary: "inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground btn-raised hover:bg-primary-strong disabled:opacity-50",
  secondary: "inline-flex h-11 items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-semibold hover:bg-accent disabled:opacity-50",
  ghost: "inline-flex h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
  danger: "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-destructive/40 px-4 text-sm font-semibold text-destructive hover:bg-destructive/5",
};

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link href={to} className="-ml-2 mb-4 inline-flex h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> {label}
    </Link>
  );
}

export function Section({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("mb-8", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const inputCls = "w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground";

type FieldProps = { label: string; name: string; hint?: string; required?: boolean; defaultValue?: string; placeholder?: string };

export function TextField({ type = "text", ...p }: FieldProps & { type?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{p.label}{p.required && <span className="text-destructive"> *</span>}</span>
      <input name={p.name} type={type} required={p.required} defaultValue={p.defaultValue} placeholder={p.placeholder} className={cn(inputCls, "mt-1.5 h-11")} />
      {p.hint && <span className="mt-1 block text-xs text-muted-foreground">{p.hint}</span>}
    </label>
  );
}

export function TextArea({ rows = 4, ...p }: FieldProps & { rows?: number }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{p.label}{p.required && <span className="text-destructive"> *</span>}</span>
      <textarea name={p.name} rows={rows} required={p.required} defaultValue={p.defaultValue} placeholder={p.placeholder} className={cn(inputCls, "mt-1.5 py-2.5")} />
      {p.hint && <span className="mt-1 block text-xs text-muted-foreground">{p.hint}</span>}
    </label>
  );
}

export function SelectField({ options, ...p }: FieldProps & { options: readonly string[] | { value: string; label: string }[] }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{p.label}{p.required && <span className="text-destructive"> *</span>}</span>
      <select name={p.name} required={p.required} defaultValue={p.defaultValue} className={cn(inputCls, "mt-1.5 h-11")}>
        {options.map((o) => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Checkbox({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-11 items-center gap-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-[var(--color-primary)]" />
      {label}
    </label>
  );
}

export { Form } from "./form";

export function LinkRow({ to, params, icon: Icon, title, sub, right }: { to: string; params?: Record<string, string>; icon?: LucideIcon; title: string; sub?: string; right?: ReactNode }) {
  return (
    <li>
      <Link href={to}  className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 hover:bg-accent">
        {Icon ? <span className="grid size-10 place-items-center rounded-md border emboss-primary"><Icon className="size-4" /></span> : <span />}
        <span className="min-w-0">
          <span className="block truncate font-semibold">{title}</span>
          {sub && <span className="block truncate text-sm text-muted-foreground">{sub}</span>}
        </span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">{right}<ChevronRight className="size-4" /></span>
      </Link>
    </li>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="divide-y overflow-hidden rounded-lg border">{children}</ul>;
}

export function Tile({ to, icon: Icon, title, sub }: { to: string; icon: LucideIcon; title: string; sub: string }) {
  return (
    <Link href={to} className="card-lift flex flex-col gap-3 rounded-lg border bg-card p-4">
      <span className="grid size-10 place-items-center rounded-md border emboss-primary"><Icon className="size-5" /></span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{sub}</span>
      </span>
    </Link>
  );
}

export function Empty({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center">
      <p className="font-semibold">{title}</p>
      {sub && <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-[var(--shadow-card)]">
      <p className="tabular font-display text-2xl font-extrabold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-muted" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-2 rounded-full bg-primary" style={{ width: `${value}%` }} />
    </div>
  );
}

export function Pills<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
      {options.map((c) => (
        <button key={c} type="button" aria-pressed={value === c} onClick={() => onChange(c)}
          className={cn("h-11 shrink-0 rounded-md border px-3.5 text-sm font-medium", value === c ? "border-primary bg-primary-soft font-semibold text-primary-strong" : "bg-background text-muted-foreground hover:text-foreground")}>
          {c}
        </button>
      ))}
    </div>
  );
}

export function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)} aria-label={`${n} stars`}
          className={cn("text-lg leading-none", onChange && "grid size-11 place-items-center", n <= value ? "text-urgent" : "text-border-strong")}>★</button>
      ))}
    </span>
  );
}

/** Simple auth-free layout for login, signup, onboarding, legal pages. */
export function BareShell({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-6xl items-center px-6">
        <Link href="/" className="font-display text-xl font-bold tracking-tight">aza<span className="text-primary">.</span></Link>
      </header>
      <main className={cn("mx-auto px-4 pb-16 pt-6", narrow ? "max-w-md" : "max-w-3xl")}>{children}</main>
    </div>
  );
}
