import type { Business } from "@/lib/types";

export default function BusinessCard({ business }: { business: Business }) {
  return (
    <div className="flex gap-3 rounded-card border border-line bg-surface p-3.5">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-paper-dim">
        {business.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logo_url}
            alt={`${business.name} logo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-lg font-bold text-ink/30">
            {business.name.charAt(0)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[14px] font-bold text-ink">
          {business.name}
        </p>
        <p className="text-[11.5px] text-ink/50">
          {business.category}
          {business.location ? ` · ${business.location}` : ""}
        </p>
        {business.description && (
          <p className="mt-1 line-clamp-2 text-[12.5px] text-ink/65">
            {business.description}
          </p>
        )}

        <div className="mt-2 flex gap-3">
          {business.whatsapp && (
            <a
              href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-semibold text-verified"
            >
              WhatsApp
            </a>
          )}
          {business.phone && (
            <a href={`tel:${business.phone}`} className="text-[12px] font-semibold text-aza">
              Call
            </a>
          )}
          {business.email && (
            <a
              href={`mailto:${business.email}`}
              className="text-[12px] font-semibold text-ink/60"
            >
              Email
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
