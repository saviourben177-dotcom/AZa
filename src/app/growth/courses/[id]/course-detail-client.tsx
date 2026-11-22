"use client";

import { useEffect, useState } from "react";
import { Clock, ExternalLink } from "lucide-react";
import { PageHeader, Tag } from "@/components/aza/ui";
import { btn } from "@/components/aza/kit";
import CoinBadge from "@/components/aza/coin-badge";
import UnlockGate from "./unlock-gate";
import FlowableReader from "./flowable-reader";
import { recordCourseOpened } from "@/lib/actions/courses";
import { openExternalUrl } from "@/lib/open-external-url";
import type { Tables } from "@/lib/supabase/database.types";

function categoryLabel(c: string): string {
  return c.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
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
        <div className="overflow-hidden rounded-lg border bg-card">
          <iframe
            src={course.pdf_url}
            title={course.title}
            className="h-[75vh] w-full"
          />
        </div>
      ) : course.external_url ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            This course lives on an external site.
          </p>
          <button
            type="button"
            onClick={() => openExternalUrl(course.external_url!)}
            className={btn.primary}
          >
            Open course <ExternalLink className="size-4" />
          </button>
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
