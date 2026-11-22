import { Clock } from "lucide-react";
import { Tag } from "@/components/aza/ui";
import SaveResourceButton from "@/components/save-resource-button";
import MarkCompleteButton from "@/components/mark-complete-button";
import { openExternalUrl } from "@/lib/open-external-url";
import type { Tables } from "@/lib/supabase/database.types";

type ResourceRow = Tables<"skill_resources"> & { skills: { id: string; name: string; category: string } | null };

/**
 * Same card layout the old (pre-Courses-rewrite) version of this feature
 * used — moved here as its own component rather than left inline, since
 * it's now scoped to "resources for skills you're tracking" rather than
 * a flat browse-everything list (that's what /growth/courses is for now).
 */
export default function ResourceList({
  resources,
  savedIds,
  completedIds,
  isAuthed,
}: {
  resources: ResourceRow[];
  savedIds: Set<string>;
  completedIds: Set<string>;
  isAuthed: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {resources.map((r) => (
        <div
          key={r.id}
          role="link"
          tabIndex={0}
          onClick={() => openExternalUrl(r.url)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openExternalUrl(r.url);
            }
          }}
          className="card-lift flex cursor-pointer flex-col gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:border-border-strong"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-primary-strong">
              {r.skills?.name}
              {r.curator_verified ? " · Verified" : ""}
            </p>
            <span onClick={(e) => e.stopPropagation()}>
              <SaveResourceButton resourceId={r.id} initialSaved={savedIds.has(r.id)} isAuthed={isAuthed} />
            </span>
          </div>
          <h3 className="text-base font-display font-bold leading-snug text-foreground">{r.title}</h3>
          <p className="text-sm text-muted-foreground">{r.provider ?? "Unknown provider"}</p>
          <div className="flex flex-wrap gap-1.5">
            {r.is_free ? <Tag tone="primary">Free</Tag> : <Tag>Paid</Tag>}
            <Tag>{r.level}</Tag>
            {r.duration_hours ? <Tag icon={<Clock className="size-3.5" />}>{r.duration_hours}h</Tag> : null}
            {r.rating ? <Tag>★{r.rating}</Tag> : null}
          </div>
          <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
            {r.skills ? (
              <MarkCompleteButton
                skillId={r.skills.id}
                resourceId={r.id}
                initialCompleted={completedIds.has(r.id)}
                isAuthed={isAuthed}
              />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
