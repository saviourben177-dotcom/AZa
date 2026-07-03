import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="font-display text-[20px] font-extrabold text-ink">About Aza</h1>

      <p className="mt-4 text-[14px] leading-relaxed text-ink/70">
        Aza helps people in Nigeria find real opportunities — scholarships, grants, hackathons,
        fellowships, internships, competitions, and gigs — in one place, without wading through
        outdated listings or scattered WhatsApp forwards.
      </p>

      <p className="mt-3 text-[14px] leading-relaxed text-ink/70">
        Beyond opportunities, Aza is building toward a fuller picture of everyday economic life:
        curator-verified market prices, a directory of local businesses, and tools like the CV
        Builder and Skills tracker to help you actually apply for what you find.
      </p>

      <div className="mt-6 rounded-card border border-line bg-surface p-4">
        <p className="text-[12px] font-bold uppercase tracking-wide text-ink/40">Company</p>
        <p className="mt-1.5 text-[14px] font-semibold text-ink">Aza Technologies</p>
        <p className="text-[13px] text-ink/60">Nigeria</p>
      </div>

      <div className="mt-3 rounded-card border border-line bg-surface p-4">
        <p className="text-[12px] font-bold uppercase tracking-wide text-ink/40">Contact</p>
        <a href="mailto:saviourben177@gmail.com" className="mt-1.5 block text-[14px] font-semibold text-aza">
          saviourben177@gmail.com
        </a>
        <p className="mt-1 text-[13px] text-ink/60">+234 708 056 9565</p>
      </div>

      <Link href="/privacy" className="mt-6 block text-[12.5px] font-semibold text-aza">
        Privacy Policy →
      </Link>
      <Link href="/profile" className="mt-3 block text-[12.5px] font-semibold text-ink/50">
        ← Back to Profile
      </Link>
    </div>
  );
}
