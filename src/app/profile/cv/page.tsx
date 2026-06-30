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

export default async function CvBuilderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="px-4 pt-12 text-center">
        <p className="font-display text-[16px] font-bold text-ink">Log in to build your CV</p>
        <Link href="/login?next=/profile/cv" className="mt-4 inline-block rounded-card bg-aza px-6 py-3 text-[14px] font-bold text-white">
          Log in
        </Link>
      </div>
    );
  }

  const [cvProfile, documents] = await Promise.all([getOrCreateCvProfile(), listCvDocuments()]);

  return (
    <div className="px-4 pb-10 pt-6">
      <div className="flex items-center gap-3">
        <Link href="/profile" aria-label="Back" className="text-ink/60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="font-display text-[18px] font-extrabold text-ink">CV Builder</h1>
          <p className="text-[12px] text-ink/55">Build once, tailor for any opportunity</p>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="font-display text-[13px] font-bold text-ink/70">Summary</h2>
        <CvSummaryEditor initialSummary={cvProfile.summary} />
      </section>

      <section className="mt-6">
        <h2 className="font-display text-[13px] font-bold text-ink/70">Scan a document</h2>
        <p className="mt-1 text-[12px] text-ink/50">
          Upload a photo of a certificate, transcript, or ID. We&apos;ll pull out the details for you to review — nothing is saved to your CV automatically.
        </p>
        <div className="mt-2.5">
          <CvDocumentUpload documents={documents} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-[13px] font-bold text-ink/70">Education</h2>
        <CvEducationList entries={cvProfile.education} />
      </section>

      <section className="mt-6">
        <h2 className="font-display text-[13px] font-bold text-ink/70">Experience</h2>
        <CvExperienceList entries={cvProfile.experience} />
      </section>

      <section className="mt-6">
        <h2 className="font-display text-[13px] font-bold text-ink/70">Certifications</h2>
        <CvCertificationsList entries={cvProfile.certifications} />
      </section>

      <section className="mt-6">
        <h2 className="font-display text-[13px] font-bold text-ink/70">Skills</h2>
        <CvSkillsEditor initialSkills={cvProfile.skills} />
      </section>

      <section className="mt-7 border-t border-line pt-5">
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
