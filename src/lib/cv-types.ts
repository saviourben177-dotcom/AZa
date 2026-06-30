// Types for the CV Builder feature. Mirrors cv_profiles / cv_documents / cv_tailorings.

export interface EducationEntry {
  id: string; // client-generated, stable for list editing
  institution: string;
  qualification: string;
  field_of_study: string | null;
  start_year: string | null;
  end_year: string | null;
  grade: string | null;
}

export interface ExperienceEntry {
  id: string;
  organization: string;
  role: string;
  start_date: string | null; // free text, e.g. "Jan 2023" — kept simple for v1
  end_date: string | null; // null + is_current = "Present"
  is_current: boolean;
  description: string | null;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string | null;
  year: string | null;
}

export interface CvProfile {
  id: string;
  user_id: string;
  photo_storage_path: string | null;
  summary: string | null;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  certifications: CertificationEntry[];
  skills: string[];
  generated_content: string | null;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CvDocumentType = "credential" | "passport";
export type CvDocumentStatus = "pending" | "processed" | "failed";

export interface CvDocument {
  id: string;
  user_id: string;
  storage_path: string;
  doc_type: CvDocumentType;
  status: CvDocumentStatus;
  extracted_data: ExtractedCredentialData | null;
  error_message: string | null;
  created_at: string;
}

// Shape returned by the Groq vision OCR pass for a single credential image.
// All fields are best-effort and must be treated as suggestions for the user
// to confirm — never auto-merged into cv_profiles without review.
export interface ExtractedCredentialData {
  document_kind: string | null; // e.g. "degree certificate", "transcript", "professional certification"
  institution: string | null;
  qualification: string | null;
  field_of_study: string | null;
  year: string | null;
  grade: string | null;
  raw_text_snippet: string | null; // short excerpt for the user to sanity-check against the OCR
}

export interface CvTailoring {
  id: string;
  user_id: string;
  opportunity_id: string;
  content: string;
  created_at: string;
}

export function emptyCvProfile(): Pick<CvProfile, "education" | "experience" | "certifications" | "skills"> {
  return { education: [], experience: [], certifications: [], skills: [] };
}
