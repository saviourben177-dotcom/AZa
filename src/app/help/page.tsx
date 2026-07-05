import Link from "next/link";

const FAQS = [
  {
    q: "How do I save an opportunity?",
    a: "Tap the bookmark icon on any opportunity card. Find everything you've saved under Profile → Saved Opportunities.",
  },
  {
    q: "How do I build my CV?",
    a: "Go to Profile → CV Builder. You can upload an existing CV to extract your details automatically, or start from scratch.",
  },
  {
    q: "How do I list something in the marketplace?",
    a: "Open the Business Hub tab and tap the create/list button. Your listings appear under Profile → My Listings.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Profile → Settings → Delete account. This permanently removes your profile, CV documents, saved items, ideas, and skills. It can't be undone.",
  },
  {
    q: "I found incorrect information on an opportunity or business listing. What do I do?",
    a: "Email us using the contact details below with a link or description of the listing, and we'll review it.",
  },
];

export default function HelpPage() {
  return (
    <div className="px-5 pb-10 pt-7">
      <h1 className="font-display text-[21px] font-bold text-ink">Help &amp; Support</h1>
      <p className="mt-2 text-[13.5px] text-ink/55">
        Answers to common questions. Can&apos;t find what you need? Reach out below.
      </p>

      <div className="mt-6 space-y-3">
        {FAQS.map((item) => (
          <div key={item.q} className="rounded-card-sm border border-line-strong bg-surface p-4 shadow-card">
            <p className="text-[14px] font-bold text-ink">{item.q}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink/60">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-card border border-line-strong bg-surface p-5 shadow-card">
        <p className="text-[14px] font-bold text-ink">Still need help?</p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink/60">
          Email us and we&apos;ll get back to you as soon as we can.
        </p>
        <a
          href="mailto:saviourben177@gmail.com"
          className="mt-4 inline-block rounded-pill bg-aza px-5 py-3 text-[13.5px] font-bold text-white shadow-glow-accent"
        >
          Email support
        </a>
        <p className="mt-3 text-[12px] text-ink/50">
          Or call/WhatsApp: <span className="font-bold text-ink/70">+234 708 056 9565</span>
        </p>
      </div>

      <Link href="/profile" className="mt-6 inline-block text-[12.5px] font-bold text-aza">
        ← Back to Profile
      </Link>
    </div>
  );
}
