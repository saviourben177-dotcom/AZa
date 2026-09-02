import Link from "next/link";
import Image from "next/image";
import { Users, Building2, LayoutGrid, HandCoins, Store, Sprout, ArrowRight } from "lucide-react";

export default function BusinessHubPage() {
  return (
    <div className="px-5 pt-7">
      <p className="text-[12px] font-bold uppercase tracking-wide text-aza">Business Hub</p>
      <h1 className="mt-1 font-display text-[24px] font-bold leading-tight text-ink">Build. Launch. Scale.</h1>

      <Link
        href="/businesses/marketplace/new"
        className="mt-6 flex items-center gap-4 rounded-card bg-gradient-to-br from-aza to-aza-dark p-5 shadow-glow-accent transition-transform active:scale-[0.98]"
      >
        <Image
          src="/icons/start-business-rocket.png"
          alt=""
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-2xl"
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[16px] font-bold text-white">Start your business</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-white/85">Turn your idea into a real, impactful business</p>
        </div>
        <ArrowRight size={18} strokeWidth={2} className="shrink-0 text-white/90" />
      </Link>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <HubCard href="/businesses/team-finder" title="Team Finder" subtitle="Find people, build together" icon={<Users size={19} strokeWidth={1.8} className="text-aza" />} />
        <HubCard href="/businesses/directory" title="Business Directory" subtitle="Browse local businesses" icon={<Building2 size={19} strokeWidth={1.8} className="text-aza" />} />
        <HubCard href="/businesses/tools" title="Business Tools" subtitle="Templates, calculators, guides" icon={<LayoutGrid size={19} strokeWidth={1.8} className="text-aza" />} />
        <HubCard href="/businesses/funding" title="Funding & Grants" subtitle="Find capital and funding" icon={<HandCoins size={19} strokeWidth={1.8} className="text-aza" />} />
        <HubCard href="/businesses/marketplace" title="Marketplace" subtitle="Buy, sell and collaborate" icon={<Store size={19} strokeWidth={1.8} className="text-aza" />} />
        <HubCard href="/businesses/incubators" title="Incubators" subtitle="Join programs and accelerators" icon={<Sprout size={19} strokeWidth={1.8} className="text-aza" />} />
      </div>
    </div>
  );
}

function HubCard({ href, title, subtitle, icon }: { href: string; title: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-card-sm border border-line-strong bg-surface p-4 shadow-card transition-transform active:scale-95">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-aza-light to-aza-light/40 shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_2px_6px_-2px_rgb(var(--accent)/0.35)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_2px_6px_-2px_rgb(var(--accent)/0.45)]">{icon}</div>
      <p className="mt-3 font-display text-[14px] font-bold text-ink">{title}</p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-ink/55">{subtitle}</p>
    </Link>
  );
}
