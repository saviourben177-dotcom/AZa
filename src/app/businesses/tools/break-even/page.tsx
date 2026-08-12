import Link from "next/link";
import BreakEvenTool from "@/components/business/break-even-tool";

export default function BreakEvenToolPage() {
  return (
    <div className="px-5 pt-7">
      <div className="flex items-center gap-3">
        <Link href="/businesses/tools" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <h1 className="font-display text-[19px] font-bold text-ink">Break-Even Calculator</h1>
      </div>

      <div className="mt-5">
        <BreakEvenTool />
      </div>
    </div>
  );
}
