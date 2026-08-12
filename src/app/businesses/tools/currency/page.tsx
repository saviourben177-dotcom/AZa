import Link from "next/link";
import CurrencyTool from "@/components/business/currency-tool";

export default function CurrencyToolPage() {
  return (
    <div className="px-5 pt-7">
      <div className="flex items-center gap-3">
        <Link href="/businesses/tools" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[19px] font-bold text-ink">Currency Reference</h1>
      </div>

      <div className="mt-5">
        <CurrencyTool />
      </div>
    </div>
  );
}
