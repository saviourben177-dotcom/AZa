// Minimal, dependency-free markdown renderer for skill-checkpoint lesson
// content. We deliberately don't pull in react-markdown/remark here — this
// project has no network access for npm installs in some environments, and
// the actual surface this needs to support is small and fixed: a handful
// of "##"/"###" section headings, **bold**, bullet lists, numbered lists,
// and plain paragraphs. That's enough to turn checkpoint content from one
// undifferentiated wall of text (whitespace-pre-wrap over a raw string)
// into something with real visible structure — Overview, Topic
// explanation, Sub-topics, Example, Summary — which is the actual problem
// this component exists to fix.
//
// Content authoring convention for every checkpoint's `content` field:
//   ## Overview
//   ## Topic: <specific sub-topic title>
//   ### Example
//   ## Summary
// Headings are optional — plain prose still renders fine as paragraphs —
// but every rewritten checkpoint should use this structure so the lesson
// reads as a real lesson, not one paragraph after another.

import type { ReactNode } from "react";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function LessonContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let listBuffer: { type: "ul" | "ol"; items: string[] } | null = null;
  let paraBuffer: string[] = [];

  function flushList() {
    if (!listBuffer) return;
    const ListTag = listBuffer.type;
    const className =
      listBuffer.type === "ul"
        ? "mb-4 ml-5 list-disc space-y-1.5"
        : "mb-4 ml-5 list-decimal space-y-1.5";
    blocks.push(
      <ListTag key={`list-${blocks.length}`} className={className}>
        {listBuffer.items.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground">
            {renderInline(item, `li-${blocks.length}-${i}`)}
          </li>
        ))}
      </ListTag>
    );
    listBuffer = null;
  }

  function flushPara() {
    if (paraBuffer.length === 0) return;
    const text = paraBuffer.join(" ").trim();
    if (text) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="mb-4 text-sm leading-relaxed text-foreground">
          {renderInline(text, `p-${blocks.length}`)}
        </p>
      );
    }
    paraBuffer = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === "") {
      flushPara();
      flushList();
      continue;
    }

    const h2 = line.match(/^##\s+(.*)/);
    const h3 = line.match(/^###\s+(.*)/);
    const ulItem = line.match(/^[-*]\s+(.*)/);
    const olItem = line.match(/^\d+\.\s+(.*)/);

    if (h2) {
      flushPara();
      flushList();
      blocks.push(
        <h2
          key={`h2-${blocks.length}`}
          className="mb-2 mt-6 font-display text-base font-bold text-foreground first:mt-0"
        >
          {h2[1]}
        </h2>
      );
      continue;
    }

    if (h3) {
      flushPara();
      flushList();
      blocks.push(
        <h3 key={`h3-${blocks.length}`} className="mb-2 mt-4 text-sm font-bold text-foreground">
          {h3[1]}
        </h3>
      );
      continue;
    }

    if (ulItem) {
      flushPara();
      if (!listBuffer || listBuffer.type !== "ul") {
        flushList();
        listBuffer = { type: "ul", items: [] };
      }
      listBuffer.items.push(ulItem[1]);
      continue;
    }

    if (olItem) {
      flushPara();
      if (!listBuffer || listBuffer.type !== "ol") {
        flushList();
        listBuffer = { type: "ol", items: [] };
      }
      listBuffer.items.push(olItem[1]);
      continue;
    }

    flushList();
    paraBuffer.push(line);
  }
  flushPara();
  flushList();

  return <div>{blocks}</div>;
}
