import Link from "next/link";
import { Clock, Lock, BookOpen } from "lucide-react";
import { Tag } from "@/components/aza/ui";
import { Progress } from "@/components/aza/kit";
import type { Tables } from "@/lib/supabase/database.types";

const SOURCE_LABEL: Record<string, string> = {
  doab: "Open Textbook",
  open_textbook_library: "Open Textbook",
  curated: "Curated",
};

function categoryLabel(c: string): string {
  return c.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/**
 * Matches the layout language of the reference course-card (bestseller
 * banner, title, provider row, duration/level stats, continue-progress
 * bar) but built entirely from this app's existing design tokens
 * (card-lift, Tag, emboss, font-display, --primary) — never a copy of
 * the reference's own purple/visual styling.
 */
export default function CourseCard({
  course,
  isAuthed,
  isUnlocked,
  progressPercent,
  isCompleted,
}: {
  course: Tables<"courses">;
  isAuthed: boolean;
  isUnlocked: boolean;
  progressPercent: number | null;
  isCompleted: boolean;
}) {
  const href = `/growth/courses/${course.id}`;

  return (
    <Link href={href} className="card-lift relative flex flex-col gap-3 overflow-hidden rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-primary-strong">
          {categoryLabel(course.category)}
        </p>
        {course.is_coin_gated && !isUnlocked ? (
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gold-light text-gold">
            <Lock className="size-3.5" />
          </span>
        ) : null}
      </div>

      <h3 className="text-base font-display font-bold leading-snug text-foreground line-clamp-2">
        {course.title}
      </h3>

      <p className="text-sm text-muted-foreground line-clamp-1">
        {course.author ?? SOURCE_LABEL[course.source] ?? "Unknown author"}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {!course.is_coin_gated ? (
          <Tag tone="primary">Free</Tag>
        ) : isUnlocked ? (
          <Tag tone="primary">Unlocked</Tag>
        ) : (
          <Tag icon={<Lock className="size-3 text-gold" />}>{course.unlock_cost} coins</Tag>
        )}
        {course.estimated_minutes ? (
          <Tag icon={<Clock className="size-3.5" />}>
            {course.estimated_minutes < 60
              ? `${course.estimated_minutes} min`
              : `${Math.round(course.estimated_minutes / 60)}h`}
          </Tag>
        ) : null}
        {course.reader_mode === "external_link" ? (
          <Tag icon={<BookOpen className="size-3.5" />}>External</Tag>
        ) : null}
      </div>

      {isAuthed && progressPercent !== null ? (
        <div className="mt-auto pt-1">
          <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>{isCompleted ? "Completed" : "In progress"}</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} />
        </div>
      ) : null}
    </Link>
  );
}
