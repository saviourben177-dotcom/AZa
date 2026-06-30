import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  LevelFormat,
} from "docx";

export const dynamic = "force-dynamic";

/**
 * GET /api/cv/export?opportunityId=<uuid>   -> tailored CV for that opportunity
 * GET /api/cv/export                         -> base CV
 *
 * Converts the stored Markdown CV content into a downloadable .docx.
 * Parsing is intentionally simple (headings, bullets, plain paragraphs) since
 * the AI is prompted to produce a predictable, flat Markdown structure.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const opportunityId = req.nextUrl.searchParams.get("opportunityId");

  let markdown: string | null = null;
  let filenameBase = "Aza-CV";

  if (opportunityId) {
    const { data: tailoring } = await supabase
      .from("cv_tailorings")
      .select("content")
      .eq("user_id", user.id)
      .eq("opportunity_id", opportunityId)
      .maybeSingle();
    if (!tailoring) {
      return NextResponse.json({ error: "No tailored CV found for this opportunity" }, { status: 404 });
    }
    markdown = tailoring.content;
    filenameBase = "Aza-CV-Tailored";
  } else {
    const { data: cv } = await supabase
      .from("cv_profiles")
      .select("generated_content")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!cv?.generated_content) {
      return NextResponse.json({ error: "No generated CV found — generate your base CV first" }, { status: 404 });
    }
    markdown = cv.generated_content;
  }

  const doc = buildDocxFromMarkdown(markdown!);
  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filenameBase}.docx"`,
    },
  });
}

function buildDocxFromMarkdown(markdown: string): Document {
  const lines = markdown.split("\n");
  const children: Paragraph[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("# ")) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun(stripMarkdownEmphasis(line.slice(2)))],
        })
      );
    } else if (line.startsWith("## ")) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun(stripMarkdownEmphasis(line.slice(3)))],
        })
      );
    } else if (line.startsWith("### ")) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun(stripMarkdownEmphasis(line.slice(4)))],
        })
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      children.push(
        new Paragraph({
          numbering: { reference: "cv-bullets", level: 0 },
          children: [new TextRun(stripMarkdownEmphasis(line.slice(2)))],
        })
      );
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun(stripMarkdownEmphasis(line))],
          spacing: { after: 120 },
        })
      );
    }
  }

  return new Document({
    numbering: {
      config: [
        {
          reference: "cv-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: "left",
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 32, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 200, after: 160 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 26, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 1 },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 23, bold: true, italics: true, font: "Arial" },
          paragraph: { spacing: { before: 140, after: 80 }, outlineLevel: 2 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children,
      },
    ],
  });
}

// Strips basic bold/italic markdown markers since we render plain runs for v1.
function stripMarkdownEmphasis(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
}
