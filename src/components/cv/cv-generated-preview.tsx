"use client";

export default function CvGeneratedPreview({
  content,
  generatedAt,
}: {
  content: string;
  generatedAt: string | null;
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11.5px] font-semibold text-ink/45">
          {generatedAt ? `Generated ${new Date(generatedAt).toLocaleDateString()}` : "Preview"}
        </p>
        <a
          href="/api/cv/export"
          className="rounded-card bg-paper-dim px-3.5 py-1.5 text-[12px] font-bold text-ink/70"
        >
          Download .docx
        </a>
      </div>
      <div className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-ink/80">
        {content}
      </div>
    </div>
  );
}
