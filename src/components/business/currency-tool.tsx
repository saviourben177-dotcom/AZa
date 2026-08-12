"use client";

import { useState, useEffect, useMemo } from "react";

type RatesResponse = Record<string, number> & { date?: string };

const COMMON_CODES = ["usd", "gbp", "eur", "ngn", "cad", "cny", "zar", "ghs", "kes", "aed"];

const CODE_LABELS: Record<string, string> = {
  usd: "US Dollar", gbp: "British Pound", eur: "Euro", ngn: "Nigerian Naira",
  cad: "Canadian Dollar", cny: "Chinese Yuan", zar: "South African Rand",
  ghs: "Ghanaian Cedi", kes: "Kenyan Shilling", aed: "UAE Dirham",
};

export default function CurrencyTool() {
  const [availableCodes, setAvailableCodes] = useState<string[]>([]);
  const [from, setFrom] = useState("usd");
  const [to, setTo] = useState("ngn");
  const [amount, setAmount] = useState("100");
  const [rates, setRates] = useState<RatesResponse | null>(null);
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ready">("idle");

  useEffect(() => {
    let cancelled = false;
    async function loadCurrencyList() {
      try {
        const res = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.min.json");
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        if (!cancelled) setAvailableCodes(Object.keys(data).sort());
      } catch {
        if (!cancelled) setAvailableCodes(COMMON_CODES);
      }
    }
    loadCurrencyList();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadRates() {
      setStatus("loading");
      try {
        const res = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${from}.min.json`);
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        if (!cancelled) {
          setRates(data[from] ?? null);
          setRateDate(data.date ?? null);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    loadRates();
    return () => { cancelled = true; };
  }, [from]);

  const converted = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (!rates || !rates[to] || isNaN(numAmount)) return null;
    return numAmount * rates[to];
  }, [rates, to, amount]);

  const codeOptions = availableCodes.length > 0 ? availableCodes : COMMON_CODES;

  function formatLabel(code: string) {
    const label = CODE_LABELS[code];
    return label ? `${code.toUpperCase()} — ${label}` : code.toUpperCase();
  }

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <div className="rounded-card border border-line-strong bg-surface p-4 shadow-card">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-[12px] font-semibold text-ink/60">Amount</label>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-card-sm border border-line bg-paper px-3.5 py-3 text-[16px] font-bold text-ink"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1">
          <label className="text-[12px] font-semibold text-ink/60">From</label>
          <select value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full rounded-card-sm border border-line bg-paper px-3 py-2.5 text-[13px]">
            {codeOptions.map((c) => <option key={c} value={c}>{formatLabel(c)}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={swap}
          aria-label="Swap currencies"
          className="mt-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong bg-paper-dim text-ink/60"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M7 10l5-5 5 5M7 14l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1">
          <label className="text-[12px] font-semibold text-ink/60">To</label>
          <select value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full rounded-card-sm border border-line bg-paper px-3 py-2.5 text-[13px]">
            {codeOptions.map((c) => <option key={c} value={c}>{formatLabel(c)}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-4 rounded-card-sm bg-aza-light p-4 text-center">
        {status === "loading" && <p className="text-[13px] font-medium text-ink/50">Loading rates...</p>}
        {status === "error" && <p className="text-[13px] font-medium text-danger">Couldn&apos;t load rates. Check your connection and try again.</p>}
        {status === "ready" && converted !== null && (
          <>
            <p className="font-display text-[22px] font-bold text-aza">
              {converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} {to.toUpperCase()}
            </p>
            <p className="mt-0.5 text-[11.5px] text-ink/50">
              1 {from.toUpperCase()} = {rates?.[to]?.toLocaleString(undefined, { maximumFractionDigits: 4 })} {to.toUpperCase()}
              {rateDate && ` · updated ${rateDate}`}
            </p>
          </>
        )}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-ink/40">
        Reference rates only — for checking what an amount roughly means in another currency, not for sending or exchanging money. Rates update daily.
      </p>
    </div>
  );
}
