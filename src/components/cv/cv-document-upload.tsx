"use client";

import { useRef, useState, useTransition } from "react";
import {
  uploadAndExtractDocument,
  deleteCvDocument,
  setCvPhotoFromDocument,
} from "@/lib/actions/cv-documents";
import type { CvDocument, CvDocumentType } from "@/lib/cv-types";

export default function CvDocumentUpload({ documents }: { documents: CvDocument[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<CvDocumentType>("credential");
  const [isUploading, startUpload] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);

    startUpload(async () => {
      try {
        await uploadAndExtractDocument(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  return (
    <div>
      <div className="flex gap-2">
        <TypeToggle label="Credential" active={docType === "credential"} onClick={() => setDocType("credential")} />
        <TypeToggle label="Passport / ID photo" active={docType === "passport"} onClick={() => setDocType("passport")} />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFilePicked}
        className="hidden"
        id="cv-doc-upload-input"
      />
      <label
        htmlFor="cv-doc-upload-input"
        className="mt-2.5 flex w-full cursor-pointer items-center justify-center rounded-card border border-dashed border-line bg-surface py-4 text-[12.5px] font-bold text-ink/60"
      >
        {isUploading ? "Uploading & reading..." : "+ Upload photo or PDF"}
      </label>

      {error && <p className="mt-2 text-[12px] font-medium text-danger">{error}</p>}

      <div className="mt-3 space-y-2.5">
        {documents.map((doc) => (
          <DocumentRow key={doc.id} doc={doc} />
        ))}
      </div>
    </div>
  );
}

function TypeToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold ${
        active ? "bg-aza text-white" : "bg-paper-dim text-ink/60"
      }`}
    >
      {label}
    </button>
  );
}

function DocumentRow({ doc }: { doc: CvDocument }) {
  const [isPending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  function handleRemove() {
    startTransition(async () => {
      await deleteCvDocument(doc.id, doc.storage_path);
      setRemoved(true);
    });
  }

  function handleUseAsPhoto() {
    startTransition(() => setCvPhotoFromDocument(doc.storage_path));
  }

  return (
    <div className="rounded-card border border-line bg-surface p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[12.5px] font-bold text-ink">
            {doc.doc_type === "passport" ? "Passport / ID" : "Credential"}
          </p>
          <StatusLabel status={doc.status} />
        </div>
        <div className="flex shrink-0 gap-3">
          {doc.doc_type === "passport" && doc.status === "processed" && (
            <button onClick={handleUseAsPhoto} disabled={isPending} className="text-[11.5px] font-semibold text-aza">
              Use as CV photo
            </button>
          )}
          <button onClick={handleRemove} disabled={isPending} className="text-[11.5px] font-semibold text-danger">
            Remove
          </button>
        </div>
      </div>

      {doc.status === "failed" && doc.error_message && (
        <p className="mt-2 text-[11.5px] text-ink/55">{doc.error_message}</p>
      )}

      {doc.status === "processed" && doc.extracted_data && doc.doc_type === "credential" && (
        <div className="mt-2.5 rounded-card bg-paper-dim p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">We read this — please verify against the original</p>
          <dl className="mt-1.5 space-y-1 text-[12px] text-ink/70">
            {doc.extracted_data.document_kind && <Row label="Type" value={doc.extracted_data.document_kind} />}
            {doc.extracted_data.institution && <Row label="Institution" value={doc.extracted_data.institution} />}
            {doc.extracted_data.qualification && <Row label="Qualification" value={doc.extracted_data.qualification} />}
            {doc.extracted_data.field_of_study && <Row label="Field" value={doc.extracted_data.field_of_study} />}
            {doc.extracted_data.year && <Row label="Year" value={doc.extracted_data.year} />}
            {doc.extracted_data.grade && <Row label="Grade" value={doc.extracted_data.grade} />}
          </dl>
          <p className="mt-2 text-[11px] text-ink/45">
            Looks right? Add it to your Education or Certifications section above manually — we keep scanning and editing separate so nothing gets added by mistake.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="font-semibold text-ink/50">{label}:</dt>
      <dd>{value}</dd>
    </div>
  );
}

function StatusLabel({ status }: { status: CvDocument["status"] }) {
  const map = {
    pending: { text: "Processing...", cls: "text-ink/45" },
    processed: { text: "Read successfully", cls: "text-aza" },
    failed: { text: "Couldn't read this one", cls: "text-danger" },
  } as const;
  const s = map[status];
  return <p className={`text-[11.5px] font-medium ${s.cls}`}>{s.text}</p>;
}
