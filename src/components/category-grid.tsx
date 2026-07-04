import Link from "next/link";
import { OPPORTUNITY_CATEGORY_LABELS, type OpportunityCategory } from "@/lib/types";

const ICONS: Record<OpportunityCategory, React.ReactNode> = {
  scholarship: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 4 2 9l10 5 8-4.2V15M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" stroke="rgb(var(--accent))" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  ),
  job_gig: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="rgb(var(--accent))" strokeWidth="1.7" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="rgb(var(--accent))" strokeWidth="1.7" />
    </svg>
  ),
  hackathon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="m9 18 6-6-6-6M15 18l1-12" stroke="rgb(var(--accent))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  internship: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.2" stroke="rgb(var(--accent))" strokeWidth="1.7" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="rgb(var(--accent))" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  grant: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="rgb(var(--accent))" strokeWidth="1.7" />
      <path d="M12 7v10M9 9.5h4.5a1.5 1.5 0 0 1 0 3H9.5a1.5 1.5 0 0 0 0 3H15" stroke="rgb(var(--accent))" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  fellowship: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="rgb(var(--accent))" strokeWidth="1.7" />
      <path d="M8 12h8M8 9h5M8 15h5" stroke="rgb(var(--accent))" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  competition: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" stroke="rgb(var(--accent))" strokeWidth="1.7" />
      <path d="M8 6H5v2a3 3 0 0 0 3 3M16 6h3v2a3 3 0 0 1-3 3M12 13v3M9 20h6l-1-4H10l-1 4Z" stroke="rgb(var(--accent))" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
};

const FEATURED: OpportunityCategory[] = [
  "scholarship",
  "job_gig",
  "hackathon",
  "internship",
  "grant",
  "fellowship",
];

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {FEATURED.map((cat) => (
        <Link
          key={cat}
          href={`/?category=${cat}`}
          className="flex flex-col items-center gap-2 rounded-card-sm border border-line-strong bg-surface py-4 shadow-card transition-transform active:scale-95"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-aza-light">
            {ICONS[cat]}
          </span>
          <span className="text-[11.5px] font-bold text-ink/80">
            {OPPORTUNITY_CATEGORY_LABELS[cat]}
          </span>
        </Link>
      ))}
    </div>
  );
}
