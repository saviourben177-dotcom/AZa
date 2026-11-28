"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, ExternalLink } from "lucide-react";
import { PageHeader, Tag } from "@/components/aza/ui";
import { btn } from "@/components/aza/kit";
import CoinBadge from "@/components/aza/coin-badge";
import UnlockGate from "./unlock-gate";
import FlowableReader from "./flowable-reader";
import { recordCourseOpened } from "@/lib/actions/courses";
import type { Tables } from "@/lib/supabase/database.types";

function categoryLabel(c: string): string {
  return c.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/**
 * Many PDF hosts (including the Red & Yellow / Strapi host used by some
 * ingested open textbooks) send `X-Frame-Options: deny` or an equivalent
 * CSP, which makes a plain <iframe src={pdf_url}> render as a silent,
 * completely empty box — no error, no console warning visible to the
 * user, nothing. That's the "newest courses show a blank box" bug:
 * every course that landed in pdf_fallback mode after ingest hit this.
 *
 * There's no reliable cross-origin way to detect "the iframe loaded but
 * was blocked by X-Frame-Options" from JS (the load event still fires).
 * So instead of pretending the iframe will always work, this always
 * shows a visible "Open PDF" link up front — the one guaranteed way to
 * read the document — with the iframe as a bonus preview underneath for
 * the hosts that do allow framing.
 */
function PdfFallbackViewer({ title, pdfUrl }: { title: string; pdfUrl: string }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // A blocked iframe still fires `load` (the browser loaded an empty
    // response), so this timeout doesn't detect blocking — it just
    // avoids showing a "loading" flash forever if `load` never fires
    // for some other reason (e.g. the request itself hangs).
    loadTimeoutRef.current = setTimeout(() => setIframeLoaded(true), 4000);
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={btn.primary}
      >
        Open PDF in new tab <ExternalLink className="size-4" />
      </a>
      <p className="text-xs text-muted-foreground">
        Some PDFs can&apos;t be previewed inline — if the box below stays empty, use the button above.
      </p>
      <div className="overflow-hidden rounded-lg border bg-card">
        <iframe
          src={pdfUrl}
          title={title}
          className="h-[75vh] w-full"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
      {!iframeLoaded ? (
        <p className="text-center text-xs text-muted-foreground">Loading preview…</p>
      ) : null}
    </div>
  );
}

export default function CourseDetailClient({
  course,
  isAuthed,
  initialIsUnlocked,
  initialCoinBalance,
  initialProgressPercent,
  initialIsCompleted,
}: {
  course: Tables<"courses">;
  isAuthed: boolean;
  initialIsUnlocked: boolean;
  initialCoinBalance: number;
  initialProgressPercent: number | null;
  initialIsCompleted: boolean;
}) {
  const [isUnlocked, setIsUnlocked] = useState(initialIsUnlocked);
  const [coinBalance, setCoinBalance] = useState(initialCoinBalance);

  useEffect(() => {
    if (isUnlocked) {
      recordCourseOpened(course.id).catch(() => {
        // Non-critical bookkeeping — a failure here shouldn't block reading.
      });
    }
  }, [course.id, isUnlocked]);

  return (
    <>
      <PageHeader
        title={course.title}
        sub={course.author ?? undefined}
        action={isAuthed ? <CoinBadge balance={coinBalance} /> : undefined}
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        <Tag tone="primary">{categoryLabel(course.category)}</Tag>
        {!course.is_coin_gated ? <Tag>Free</Tag> : null}
        {course.estimated_minutes ? (
          <Tag icon={<Clock className="size-3.5" />}>
            {course.estimated_minutes < 60 ? `${course.estimated_minutes} min read` : `~${Math.round(course.estimated_minutes / 60)}h read`}
          </Tag>
        ) : null}
        {course.license ? <Tag>{course.license}</Tag> : null}
      </div>

      {course.summary ? (
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{course.summary}</p>
      ) : null}

      {!isUnlocked ? (
        <UnlockGate
          courseId={course.id}
          cost={course.unlock_cost}
          coinBalance={coinBalance}
          isAuthed={isAuthed}
          onUnlocked={(newBalance) => {
            setCoinBalance(newBalance);
            setIsUnlocked(true);
          }}
        />
      ) : course.reader_mode === "flowable" && course.flowable_content ? (
        <FlowableReader
          courseId={course.id}
          content={course.flowable_content}
          initialProgressPercent={initialProgressPercent}
        />
      ) : course.reader_mode === "pdf_fallback" && course.pdf_url ? (
        <PdfFallbackViewer title={course.title} pdfUrl={course.pdf_url} />
      ) : course.external_url ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            This course lives on an external site.
          </p>
          <a
            href={course.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className={btn.primary}
          >
            Open course <ExternalLink className="size-4" />
          </a>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This course isn&apos;t available to read right now — check back soon.
        </p>
      )}

      {isAuthed && isUnlocked && (course.reader_mode === "flowable" || course.reader_mode === "pdf_fallback") && initialIsCompleted ? (
        <p className="mt-4 text-center text-sm font-semibold text-primary-strong">You&apos;ve completed this course 🎉</p>
      ) : null}
    </>
  );
}
