import type { Business } from "@/lib/types";
import SaveBusinessButton from "@/components/save-business-button";

export default function BusinessCard({
  business,
  isSaved = false,
  isAuthed = false,
}: {
  business: Business;
  isSaved?: boolean;
  isAuthed?: boolean;
}) {
  return (
    <div className="flex gap-3.5 rounded-card border border-line-strong bg-surface p-4 shadow-card">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-card-sm bg-aza-light">
        {business.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logo_url}
            alt={`${business.name} logo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-lg font-bold text-aza">
            {business.name.charAt(0)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-display text-[15px] font-bold text-ink">
            {business.name}
          </p>
          <SaveBusinessButton businessId={business.id} initialSaved={isSaved} isAuthed={isAuthed} />
        </div>
        <p className="text-[11.5px] font-medium text-ink/50">
          {business.category}
          {business.location ? ` · ${business.location}` : ""}
        </p>
        {business.description && (
          <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink/65">
            {business.description}
          </p>
        )}

        <div className="mt-2.5 flex gap-2">
          {business.whatsapp && (
            <a
              href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-pill bg-aza-light px-2.5 py-1 text-[11.5px] font-bold text-aza"
            >
              WhatsApp
            </a>
          )}
          {business.phone && (
            <a href={`tel:${business.phone}`} className="rounded-pill bg-paper-dim px-2.5 py-1 text-[11.5px] font-bold text-ink/70">
              Call
            </a>
          )}
          {business.email && (
            <a
              href={`mailto:${business.email}`}
              className="rounded-pill bg-paper-dim px-2.5 py-1 text-[11.5px] font-bold text-ink/70"
            >
              Email
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
