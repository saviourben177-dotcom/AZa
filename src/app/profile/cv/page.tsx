import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateCvProfile } from "@/lib/actions/cv-profile";
import { listCvDocuments } from "@/lib/actions/cv-documents";

export const dynamic = "force-dynamic";

/**
 * CV Studio hub — spec-matched landing view (My CV card, Tailored CVs,
 * Documents). The full field-by-field editor this used to open directly
 * into now lives at /profile/cv/edit with zero logic changes, so nothing
 * that worked before was removed — it's one tap deeper, behind this hub,
 * matching the mockup's structure.
 */
export default async function CvStudioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="px-4 pt-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-aza-light text-2xl shadow-card">📄</div>
        <p className="mt-4 text-[17px] font-semibold text-ink">Log in to build your CV</p>
        <Link href="/login?next=/profile/cv" className="mt-5 inline-block w-full rounded-pill bg-aza px-6 py-3.5 text-[14.5px] font-semibold text-white shadow-glow-accent">
          Log in
        </Link>
      </div>
    );
  }

  const [cvProfile, documents, { data: tailorings }] = await Promise.all([
    getOrCreateCvProfile(),
    listCvDocuments(),
    supabase
      .from("cv_tailorings")
      .select("*, opportunities(title, org)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const completion = estimateCompletion(cvProfile);

  return (
    <div className="px-4 pb-10 pt-6">
      <h1 className="text-[22px] font-bold leading-tight text-ink">CV Studio</h1>

      <Link href="/profile/cv/edit" className="mt-4 flex items-center gap-3.5 rounded-card bg-surface p-4 shadow-card">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card-sm bg-aza-light text-aza">
          <CvIcon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-semibold text-ink">My CV</p>
          <p className="text-[11.5px] font-medium text-text-tertiary">
            {cvProfile.updated_at
              ? `Last updated ${new Date(cvProfile.updated_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`
              : "Not started yet"}
          </p>
        </div>
        <CompletionRing percent={completion} />
      </Link>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-ink">Tailored CVs</h2>
          {tailorings && tailorings.length > 0 && (
            <span className="text-[12.5px] font-semibold text-text-secondary">{tailorings.length} version{tailorings.length === 1 ? "" : "s"}</span>
          )}
        </div>
        <div className="mt-3 space-y-2.5">
          {(!tailorings || tailorings.length === 0) && (
            <p className="text-[12.5px] text-text-secondary">
              Tailor your CV from any opportunity&apos;s detail page to see versions here.
            </p>
          )}
          {tailorings?.map((t) => {
            const opp = t.opportunities as unknown as { title: string; org: string } | null;
            return (
              <Link
                key={t.id}
                href={`/opportunities/${t.opportunity_id}`}
                className="flex items-center gap-3 rounded-card bg-surface p-3.5 shadow-card"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card-sm bg-tag-blue-bg text-tag-blue">
                  <CvIcon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{opp?.title ?? "Tailored CV"}</p>
                  <p className="text-[11px] font-medium text-text-tertiary">
                    Tailored on {new Date(t.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                {/* No match_score column on cv_tailorings — the mockup's
                    "92% Match" badge is intentionally omitted rather than
                    inventing a percentage. */}
              </Link>
            );
          })}
        </div>
      </section>

      <section id="documents" className="mt-6 scroll-mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-ink">Documents</h2>
          {documents.length > 0 && (
            <span className="text-[12.5px] font-semibold text-text-secondary">{documents.length} document{documents.length === 1 ? "" : "s"}</span>
          )}
        </div>
        <div className="mt-3 space-y-2.5">
          {documents.length === 0 && (
            <p className="text-[12.5px] text-text-secondary">No documents uploaded yet.</p>
          )}
          {documents.slice(0, 5).map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-card bg-surface p-3.5 shadow-card">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card-sm bg-tag-orange-bg text-tag-orange">
                <DocIcon />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold capitalize text-ink">
                  {doc.doc_type?.replace(/_/g, " ") ?? "Document"}
                </p>
                <p className="text-[11px] font-medium text-text-tertiary">
                  Uploaded {new Date(doc.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                  {doc.status && doc.status !== "completed" ? ` · ${doc.status}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Link
        href="/profile/cv/edit"
        className="mt-7 block rounded-pill bg-aza py-3.5 text-center text-[14.5px] font-semibold text-white shadow-glow-accent"
      >
        Edit My CV
      </Link>
    </div>
  );
}

function estimateCompletion(cv: {
  summary: string | null;
  education: unknown[];
  experience: unknown[];
  skills: unknown[];
  certifications: unknown[];
}): number {
  const fields = [
    !!cv.summary && cv.summary.trim().length > 0,
    (cv.education?.length ?? 0) > 0,
    (cv.experience?.length ?? 0) > 0,
    (cv.skills?.length ?? 0) > 0,
    (cv.certifications?.length ?? 0) > 0,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

function CompletionRing({ percent }: { percent: number }) {
  const size = 40;
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgb(var(--paper-dim))" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="rgb(var(--accent))" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-aza">
        {percent}%
      </div>
    </div>
  );
}

function CvIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 3.5h7L18.5 8V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3.5V8h4.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M7 3.5h7L18.5 8V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.5 12.5h7M8.5 15.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
