import Link from "next/link";

export default function BusinessHubPage() {
  return (
    <div className="px-5 pt-7">
      <p className="text-[12px] font-bold uppercase tracking-wide text-aza">Business Hub</p>
      <h1 className="mt-1 font-display text-[24px] font-bold leading-tight text-ink">Build. Launch. Scale.</h1>

      <Link
        href="/businesses/marketplace/new"
        className="mt-6 block rounded-card bg-aza p-5 shadow-glow-accent transition-transform active:scale-[0.98]"
      >
        <p className="font-display text-[16px] font-bold text-white">Start your business</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-white/85">Turn your idea into a real, impactful business →</p>
      </Link>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <HubCard href="/businesses/directory" title="Business Directory" subtitle="Browse local businesses" icon={<DirectoryIcon />} />
        <HubCard href="/businesses/tools" title="Business Tools" subtitle="Templates, calculators, guides" icon={<ToolsIcon />} />
        <HubCard href="/businesses/funding" title="Funding & Grants" subtitle="Find capital and funding" icon={<FundingIcon />} />
        <HubCard href="/businesses/marketplace" title="Marketplace" subtitle="Buy, sell and collaborate" icon={<MarketplaceIcon />} />
        <HubCard href="/businesses/incubators" title="Incubators" subtitle="Join programs and accelerators" icon={<IncubatorIcon />} />
      </div>
    </div>
  );
}

function HubCard({ href, title, subtitle, icon }: { href: string; title: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-card-sm border border-line-strong bg-surface p-4 shadow-card transition-transform active:scale-95">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-aza-light">{icon}</div>
      <p className="mt-3 font-display text-[14px] font-bold text-ink">{title}</p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-ink/55">{subtitle}</p>
    </Link>
  );
}

function DirectoryIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" stroke="rgb(var(--accent))" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}
function ToolsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="7" height="7" rx="1" stroke="rgb(var(--accent))" strokeWidth="1.6" /><rect x="13" y="4" width="7" height="7" rx="1" stroke="rgb(var(--accent))" strokeWidth="1.6" /><rect x="4" y="13" width="7" height="7" rx="1" stroke="rgb(var(--accent))" strokeWidth="1.6" /><rect x="13" y="13" width="7" height="7" rx="1" stroke="rgb(var(--accent))" strokeWidth="1.6" /></svg>;
}
function FundingIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="rgb(var(--accent))" strokeWidth="1.6" /><path d="M12 7v10M9 9.5h4.5a1.5 1.5 0 0 1 0 3H9.5a1.5 1.5 0 0 0 0 3H15" stroke="rgb(var(--accent))" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}
function MarketplaceIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l1.5-5h15L21 9M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9ZM9 13a3 3 0 0 0 6 0" stroke="rgb(var(--accent))" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}
function IncubatorIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2c4 4 6 8 6 11a6 6 0 0 1-12 0c0-3 2-7 6-11Z" stroke="rgb(var(--accent))" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}
