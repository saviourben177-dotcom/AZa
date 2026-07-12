"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { extractCredentialFromImage } from "@/lib/groq";
import type { CvDocumentType, CvDocument, CvDocumentStatus, ExtractedCredentialData } from "@/lib/cv-types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

const MAX_FILE_BYTES = 20 * 1024 * 1024; // matches bucket file_size_limit
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/**
 * Uploads a credential/passport file to private storage, records it in cv_documents,
 * then runs OCR extraction (image inputs only — see note on PDFs below).
 *
 * PDF note: Groq's vision input accepts images, not raw PDF bytes. For v1, PDF
 * uploads are stored and recorded but OCR is skipped with a clear status so the
 * user can fall back to manual entry; image-based credentials (jpg/png/webp,
 * including phone photos of documents) are the fully-supported path.
 */
export async function uploadAndExtractDocument(formData: FormData) {
  const { supabase, user } = await requireUser();

  const file = formData.get("file") as File | null;
  const docType = (formData.get("doc_type") as CvDocumentType) ?? "credential";

  if (!file || file.size === 0) throw new Error("No file provided");
  if (file.size > MAX_FILE_BYTES) throw new Error("File is too large (max 20MB)");
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error("Unsupported file type");

  const ext = file.name.split(".").pop() || "bin";
  const subfolder = docType === "passport" ? "passport" : "credentials";
  const path = `${user.id}/${subfolder}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("user-documents").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data: docRow, error: insertError } = await supabase
    .from("cv_documents")
    .insert({ user_id: user.id, storage_path: path, doc_type: docType, status: "pending" })
    .select("*")
    .single();
  if (insertError) throw new Error(insertError.message);

  if (file.type === "application/pdf") {
    await supabase
      .from("cv_documents")
      .update({
        status: "failed",
        error_message: "PDF OCR is not supported yet — please add the details manually below, or re-upload as a photo/image of the document.",
      })
      .eq("id", docRow.id);
    revalidatePath("/profile/cv");
    return;
  }

  try {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const extracted = await extractCredentialFromImage(dataUrl, docType);

    await supabase
      .from("cv_documents")
      .update({ status: "processed", extracted_data: extracted })
      .eq("id", docRow.id);
  } catch (err) {
    await supabase
      .from("cv_documents")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "OCR extraction failed",
      })
      .eq("id", docRow.id);
  }

  revalidatePath("/profile/cv");
}

export async function listCvDocuments(): Promise<CvDocument[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("cv_documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  // doc_type/status are plain `text` columns in Postgres (not DB-level enums), so the generated
  // types widen them to `string`. This app only ever writes the values below, so the cast is
  // safe; if an unexpected value somehow landed in the DB we fall back to sensible defaults
  // rather than letting a bad row crash the whole documents list.
  return (data ?? []).map((row) => ({
    ...row,
    doc_type: (row.doc_type === "credential" || row.doc_type === "passport" ? row.doc_type : "credential") as CvDocumentType,
    status: (["pending", "processed", "failed"].includes(row.status) ? row.status : "pending") as CvDocumentStatus,
    extracted_data: row.extracted_data as unknown as ExtractedCredentialData | null,
  }));
}

export async function deleteCvDocument(documentId: string, storagePath: string) {
  const { supabase, user } = await requireUser();
  await supabase.storage.from("user-documents").remove([storagePath]);
  await supabase.from("cv_documents").delete().eq("id", documentId).eq("user_id", user.id);
  revalidatePath("/profile/cv");
}

/** Sets the uploaded passport image as the CV's profile photo. */
export async function setCvPhotoFromDocument(storagePath: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("cv_profiles")
    .update({ photo_storage_path: storagePath })
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/profile/cv");
}

/** Generates a short-lived signed URL so the private bucket image can be displayed/downloaded. */
export async function getSignedDocumentUrl(storagePath: string): Promise<string> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.storage
    .from("user-documents")
    .createSignedUrl(storagePath, 60 * 10); // 10 minutes
  if (error || !data) throw new Error(error?.message ?? "Could not create signed URL");
  return data.signedUrl;
}
