"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { saveCourseProgress } from "@/lib/actions/courses";

const FONT_SIZES = ["sm", "base", "lg", "xl"] as const;
type FontSize = (typeof FONT_SIZES)[number];
const FONT_SIZE_CLASS: Record<FontSize, string> = {
  sm: "text-sm leading-relaxed",
  base: "text-base leading-relaxed",
  lg: "text-lg leading-loose",
  xl: "text-xl leading-loose",
};

/**
 * Renders extracted PDF text as plain reflowable paragraphs — NOT a
 * markdown renderer (unlike LessonContent, which is for hand-authored
 * checkpoint lessons). Raw extracted book/textbook text can legitimately
 * contain characters like "#", "-", or leading digits that would
 * misfire as markdown syntax, so this only ever splits on blank lines
 * into <p> tags — the honest, unedited presentation the courses.
 * flowable_content column comment calls for.
 */
function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);
}

export default function FlowableReader({
  courseId,
  content,
  initialProgressPercent,
}: {
  courseId: string;
  content: string;
  initialProgressPercent: number | null;
}) {
  const paragraphs = useMemo(() => splitIntoParagraphs(content), [content]);
  const [fontSize, setFontSize] = useState<FontSize>("base");
  const containerRef = useRef<HTMLDivElement>(null);
  const hasRestoredScroll = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedPercentRef = useRef<number | null>(initialProgressPercent);

  // Restore scroll position from saved progress on first mount only — a
  // percentage of the full scrollable height, since flowed text has no
  // fixed "page" to jump back to.
  useEffect(() => {
    if (hasRestoredScroll.current) return;
    const el = containerRef.current;
    if (!el || !initialProgressPercent || initialProgressPercent <= 0) {
      hasRestoredScroll.current = true;
      return;
    }
    const scrollable = el.scrollHeight - el.clientHeight;
    if (scrollable > 0) {
      el.scrollTop = (initialProgressPercent / 100) * scrollable;
    }
    hasRestoredScroll.current = true;
  }, [initialProgressPercent]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleScroll() {
      if (!el) return;
      const scrollable = el.scrollHeight - el.clientHeight;
      const percent = scrollable <= 0 ? 100 : Math.round((el.scrollTop / scrollable) * 100);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        // Only write when it actually changed meaningfully — avoids a
        // write on every tiny scroll-stop while someone is reading.
        if (lastSavedPercentRef.current === null || Math.abs(percent - lastSavedPercentRef.current) >= 2) {
          lastSavedPercentRef.current = percent;
          saveCourseProgress(courseId, percent).catch(() => {
            // Progress saving is a nice-to-have, not critical to reading —
            // swallow the error rather than interrupt the reader with a toast
            // every time a transient network blip happens mid-scroll.
          });
        }
      }, 800);
    }

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [courseId]);

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center justify-between rounded-lg border bg-card p-2">
        <span className="px-2 text-xs font-semibold text-muted-foreground">Text size</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Decrease text size"
            disabled={fontSize === FONT_SIZES[0]}
            onClick={() => setFontSize((s) => FONT_SIZES[Math.max(0, FONT_SIZES.indexOf(s) - 1)])}
            className="grid size-9 place-items-center rounded-md hover:bg-accent disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Increase text size"
            disabled={fontSize === FONT_SIZES[FONT_SIZES.length - 1]}
            onClick={() => setFontSize((s) => FONT_SIZES[Math.min(FONT_SIZES.length - 1, FONT_SIZES.indexOf(s) + 1)])}
            className="grid size-9 place-items-center rounded-md hover:bg-accent disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-[65vh] overflow-y-auto rounded-lg border bg-card p-5 md:h-[70vh] md:p-8"
      >
        <div className={FONT_SIZE_CLASS[fontSize]}>
          {paragraphs.map((para, i) => (
            <p key={i} className="mb-4 text-foreground last:mb-0">
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
