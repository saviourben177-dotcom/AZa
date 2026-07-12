import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateCvProfile } from "@/lib/actions/cv-profile";
import { listCvDocuments } from "@/lib/actions/cv-documents";
import CvSummaryEditor from "@/components/cv/cv-summary-editor";
import CvSkillsEditor from "@/components/cv/cv-skills-editor";
import CvEducationList from "@/components/cv/cv-education-list";
import CvExperienceList from "@/components/cv/cv-experience-list";
import CvCertificationsList from "@/components/cv/cv-certifications-list";
import CvDocumentUpload from "@/components/cv/cv-document-upload";
import CvGenerateButton from "@/components/cv/cv-generate-button";
import CvGeneratedPreview from "@/components/cv/cv-generated-preview";

export const dynamic = "force-dynamic";

export default async function CvBuilderEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="px-5 pt-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-aza-light text-2xl shadow-card">📄</div>
        <p className="mt-4 text-[17px] font-bold text-ink">Log in to build your CV</p>
        <Link href="/login?next=/profile/cv" className="mt-5 inline-block w-full rounded-pill bg-aza px-6 py-3.5 text-[14.5px] font-semibold text-white shadow-glow-accent">
          Log in
        </Link>
      </div>
    );
  }

  const [cvProfile, documents] = await Promise.all([getOrCreateCvProfile(), listCvDocuments()]);

  return (
    <div className="px-4 pb-10 pt-6">
      <div className="flex items-center gap-3">
        <Link href="/profile/cv" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-dim text-ink/70">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-[19px] font-semibold text-ink">CV Builder</h1>
          <p className="text-[12px] text-text-secondary">Build once, tailor for any opportunity</p>
        </div>
      </div>

      <section className="mt-7">
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-text-tertiary">Summary</h2>
        <div className="mt-2.5"><CvSummaryEditor initialSummary={cvProfile.summary} /></div>
      </section>

      <section className="mt-7">
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-text-tertiary">Scan a document</h2>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-secondary">
          Upload a photo of a certificate, transcript, or ID. We&apos;ll pull out the details for you to review — nothing is saved to your CV automatically.
        </p>
        <div className="mt-3">
          <CvDocumentUpload documents={documents} />
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-text-tertiary">Education</h2>
        <div className="mt-2.5"><CvEducationList entries={cvProfile.education} /></div>
      </section>

      <section className="mt-7">
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-text-tertiary">Experience</h2>
        <div className="mt-2.5"><CvExperienceList entries={cvProfile.experience} /></div>
      </section>

      <section className="mt-7">
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-text-tertiary">Certifications</h2>
        <div className="mt-2.5"><CvCertificationsList entries={cvProfile.certifications} /></div>
      </section>

      <section className="mt-7">
        <h2 className="text-[12px] font-bold uppercase tracking-wide text-text-tertiary">Skills</h2>
        <div className="mt-2.5"><CvSkillsEditor initialSkills={cvProfile.skills} /></div>
      </section>

      <section className="mt-8 border-t border-divider pt-6">
        <CvGenerateButton hasGenerated={!!cvProfile.generated_content} />
        {cvProfile.generated_content && (
          <div className="mt-4">
            <CvGeneratedPreview content={cvProfile.generated_content} generatedAt={cvProfile.generated_at} />
          </div>
        )}
      </section>
    </div>
  );
}
