import Link from "next/link";

export default function BusinessHubPage() {
  return (
    <div className="px-4 pt-6">
      <h1 className="font-display text-[20px] font-extrabold text-ink">Business Hub</h1>
      <p className="mt-0.5 text-[12.5px] text-ink/60">Build. Launch. Scale.</p>

      <Link
        href="/businesses/marketplace/new"
        className="mt-5 block rounded-card bg-aza p-4"
      >
        <p className="font-display text-[15px] font-bold text-white">Start your business</p>
        <p className="mt-0.5 text-[12px] text-white/85">Turn your idea into a real, impactful business →</p>
      </Link>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <HubCard href="/businesses/directory" title="Business Directory" subtitle="Browse local businesses" icon={<DirectoryIcon />} />
        <HubCard href="/businesses/tools" title="Business Tools" subtitle="Templates, calculators, guides" icon={<ToolsIcon />} />
        <HubCard href="/businesses/funding" title="Funding & Grants" subtitle="Find capital and funding" icon={<FundingIcon />} />
        <HubCard href="/businesses/marketplace" title="Marketplace" subtitle="Buy, sell and collaborate" icon={<MarketplaceIcon />} />
        <HubCard href="/businesses/incubators" title="Incubators" subtitle="Join programs and accelerators" icon={<IncubatorIcon />} />
        <DisabledHubCard title="Team Finder" subtitle="Find co-founders and teams" icon={<TeamIcon />} badge="Soon" />
      </div>
    </div>
  );
}

function HubCard({ href, title, subtitle, icon }: { href: string; title: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-card border border-line bg-surface p-3.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-aza-light">{icon}</div>
      <p className="mt-2.5 font-display text-[13.5px] font-bold text-ink">{title}</p>
      <p className="mt-0.5 text-[11px] text-ink/55">{subtitle}</p>
    </Link>
  );
}

function DisabledHubCard({ title, subtitle, icon, badge }: { title: string; subtitle: string; icon: React.ReactNode; badge: string }) {
  return (
    <div className="rounded-card border border-line bg-surface/50 p-3.5 opacity-60">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-dim">{icon}</div>
        <span className="rounded-full bg-paper-dim px-2 py-0.5 text-[9.5px] font-bold uppercase text-ink/40">{badge}</span>
      </div>
      <p className="mt-2.5 font-display text-[13.5px] font-bold text-ink/60">{title}</p>
      <p className="mt-0.5 text-[11px] text-ink/40">{subtitle}</p>
    </div>
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
function TeamIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="2.8" stroke="rgba(15,18,16,.4)" strokeWidth="1.5" /><circle cx="17" cy="9" r="2.2" stroke="rgba(15,18,16,.4)" strokeWidth="1.5" /><path d="M3.5 19c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5M14.5 19c0-2-1.6-3.7-3.8-4.4" stroke="rgba(15,18,16,.4)" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
