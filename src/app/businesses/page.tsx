import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BusinessHubPage() {
  const supabase = await createClient();
  const { count: grantCount } = await supabase
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("category", "grant");

  return (
    <div className="px-4 pt-6">
      <h1 className="text-[22px] font-bold leading-tight text-ink">Business Hub</h1>
      <p className="mt-1 text-[13px] text-text-secondary">Build. Connect. Grow.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <HubCard href="/businesses/marketplace/new" title="Start a Business" subtitle="Guides, templates & checklists" icon={<StartIcon />} tint="teal" />
        <HubCard href="/businesses/directory" title="Business Directory" subtitle="Find businesses near you" icon={<DirectoryIcon />} tint="orange" />
        <HubCard href="/businesses/team-finder" title="Team Finder" subtitle="Find teams, join projects" icon={<TeamFinderIcon />} tint="purple" />
        <HubCard href="/businesses/marketplace" title="Marketplace" subtitle="Buy, sell or offer services" icon={<MarketplaceIcon />} tint="pink" />
        <HubCard href="/businesses/incubators" title="Incubators" subtitle="Discover programs and apply" icon={<IncubatorIcon />} tint="blue" />
        <HubCard href="/businesses/tools" title="Business Tools" subtitle="Templates, calculators & more" icon={<ToolsIcon />} tint="teal" />
      </div>

      <Link
        href="/businesses/funding"
        className="mt-5 flex items-center justify-between rounded-lg bg-aza-light p-5"
      >
        <div className="pr-3">
          <p className="text-[15px] font-semibold text-ink">Need funding?</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink/65">
            {grantCount && grantCount > 0
              ? `Explore ${grantCount} grant${grantCount === 1 ? "" : "s"} and programs for your business`
              : "Explore grants and programs for your business"}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aza text-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </Link>
    </div>
  );
}

const TINTS = {
  teal: { bg: "bg-tag-teal-bg", fg: "text-tag-teal" },
  orange: { bg: "bg-tag-orange-bg", fg: "text-tag-orange" },
  purple: { bg: "bg-tag-purple-bg", fg: "text-tag-purple" },
  pink: { bg: "bg-tag-pink-bg", fg: "text-tag-pink" },
  blue: { bg: "bg-tag-blue-bg", fg: "text-tag-blue" },
} as const;

function HubCard({
  href, title, subtitle, icon, tint,
}: {
  href: string; title: string; subtitle: string; icon: React.ReactNode; tint: keyof typeof TINTS;
}) {
  const t = TINTS[tint];
  return (
    <Link href={href} className="rounded-card bg-surface p-4 shadow-card transition-transform active:scale-95">
      <div className={`flex h-10 w-10 items-center justify-center rounded-card-sm ${t.bg} ${t.fg}`}>{icon}</div>
      <p className="mt-3 text-[14px] font-semibold text-ink">{title}</p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-text-secondary">{subtitle}</p>
    </Link>
  );
}

function StartIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}
function TeamFinderIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" /><circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.6" /><path d="M3 20c0-3 2.5-5.5 6-5.5s6 2.5 6 5.5M15 20c0-2.2-1-4-2.5-5.1a5.2 5.2 0 0 1 8 4.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
function DirectoryIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}
function ToolsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" /><rect x="13" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" /><rect x="4" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" /><rect x="13" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" /></svg>;
}
function MarketplaceIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l1.5-5h15L21 9M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9ZM9 13a3 3 0 0 0 6 0" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}
function IncubatorIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2c4 4 6 8 6 11a6 6 0 0 1-12 0c0-3 2-7 6-11Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}
