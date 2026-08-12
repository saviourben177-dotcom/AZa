import Link from "next/link";

const SECTIONS = [
  {
    title: "1. What you're selling",
    body: "One or two sentences. What does the customer get, and what problem does it solve for them? Avoid jargon — write it the way you'd explain it to a neighbour.",
  },
  {
    title: "2. Who buys it",
    body: "Be specific. Not \"everyone\" — pick one type of customer you understand well. Where do they live or work? What do they currently do instead of buying from you?",
  },
  {
    title: "3. How you'll reach them",
    body: "WhatsApp status, a market stall, referrals, social media, a physical shop — name the one or two channels you'll actually use in the first three months, not every channel that exists.",
  },
  {
    title: "4. What it costs to start",
    body: "List every one-off cost: stock, equipment, registration, rent deposit. Add them up. This is the amount you need before you open.",
  },
  {
    title: "5. What it costs to run each month",
    body: "Rent, transport, restocking, data, salaries if any. Add these up separately from your starting costs — this is what you need every month just to keep going.",
  },
  {
    title: "6. What you'll charge",
    body: "Your price needs to cover your monthly running cost divided by how many customers you expect, plus a profit margin. If you can't explain why the price is what it is, it's a guess, not a plan.",
  },
  {
    title: "7. Break-even point",
    body: "How many sales, in a month, before you've covered your monthly running cost? This is the number that tells you if the business is realistic at the price and volume you're expecting.",
  },
];

export default function BusinessPlanGuidePage() {
  return (
    <div className="px-5 pb-10 pt-7">
      <Link href="/businesses/tools" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-ink/60 shadow-card">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </Link>

      <h1 className="mt-4 font-display text-[19px] font-bold text-ink">One-Page Business Plan</h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink/55">
        Seven questions. If you can answer all of them in a few sentences each, you have a plan a bank officer, investor, or co-founder can actually follow.
      </p>

      <div className="mt-6 space-y-4">
        {SECTIONS.map((s) => (
          <div key={s.title} className="rounded-card border border-line-strong bg-surface p-4 shadow-card">
            <p className="text-[13.5px] font-bold text-ink">{s.title}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink/65">{s.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 rounded-card-sm bg-paper-dim px-3.5 py-3 text-[11.5px] leading-relaxed text-ink/55">
        This won&apos;t cover every situation — for a loan application or investor pitch, you may need more detail. Use this as your starting draft.
      </p>
    </div>
  );
}
