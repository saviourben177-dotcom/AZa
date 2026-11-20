import Link from "next/link";

export default function CategoryPills({
  categories,
  active,
  labelFn,
}: {
  categories: string[];
  active: string | null;
  labelFn: (c: string) => string;
}) {
  return (
    <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
      {/* "All" links to ?category=all explicitly, rather than clearing
          the param entirely — on the Courses list this distinguishes
          "the person chose to see everything" from "no choice has been
          made yet" (the bare-URL case), which is what lets the page
          apply an onboarding-based suggested category only on that
          first, un-chosen visit. */}
      <Chip label="All" active={!active} category="all" />
      {categories.map((c) => (
        <Chip key={c} label={labelFn(c)} active={active === c} category={c} />
      ))}
    </div>
  );
}

function Chip({ label, active, category }: { label: string; active: boolean; category: string }) {
  return (
    <Link
      href={`/growth/courses?category=${category}`}
      className={`h-11 shrink-0 rounded-md border px-3.5 text-sm font-medium flex items-center ${
        active
          ? "border-primary bg-primary-soft font-semibold text-primary-strong"
          : "bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
