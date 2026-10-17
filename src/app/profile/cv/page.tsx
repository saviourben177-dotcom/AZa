import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn, Empty, Progress, Section } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";
import { createClient } from "@/lib/supabase/server";
import { asJsonEntryArray, type EducationEntry, type ExperienceEntry } from "@/lib/cv-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your CV — Aza",
  description: "View your CV and tailor it to each opportunity.",
};

export default async function CvPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/profile/cv");

  const [{ data: p }, { data: cv }] = await Promise.all([
    supabase.from("profiles").select("full_name, job_title, exact_location, region").eq("id", user.id).maybeSingle(),
    supabase.from("cv_profiles").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const name = p?.full_name || user.email?.split("@")[0] || "User";
  const role = p?.job_title || "";
  const location = p?.exact_location || p?.region || "";
  const summary = cv?.summary ?? "";
  const skills = cv?.skills ?? [];
  const education = asJsonEntryArray<EducationEntry>(cv?.education);
  const experience = asJsonEntryArray<ExperienceEntry>(cv?.experience);

  const sections = [!!summary.trim(), skills.length > 0, education.length > 0, experience.length > 0];
  const completion = Math.round((sections.filter(Boolean).length / sections.length) * 100);

  return (
    <AppShell>
      <BackLink to="/profile" label="Profile" />
      <PageHeader
        title="Your CV"
        action={
          <Link href="/profile/cv/edit" className={btn.primary}>
            Edit CV
          </Link>
        }
      />
      <div className="mb-8 max-w-2xl rounded-lg border bg-primary-soft p-4">
        <p className="mb-2 text-sm font-bold text-primary-strong">{completion}% complete</p>
        <Progress value={completion} />
      </div>
      <article className="max-w-2xl rounded-lg border bg-card p-6 shadow-[var(--shadow-lift)]">
        <h2 className="text-2xl font-display font-bold text-foreground">{name}</h2>
        {(role || location) && (
          <p className="mb-6 text-sm text-muted-foreground">
            {[role, location].filter(Boolean).join(" · ")}
          </p>
        )}

        <Section title="Summary">
          {summary ? (
            <p className="text-sm leading-relaxed text-foreground">{summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Not added yet</p>
          )}
        </Section>

        <Section title="Experience">
          {experience.length > 0 ? (
            <div className="space-y-3">
              {experience.map((e) => (
                <p key={e.id} className="text-sm text-foreground">
                  <b>{e.role}, {e.organization}</b> · {e.start_date ?? ""} – {e.is_current ? "now" : e.end_date ?? ""}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not added yet</p>
          )}
        </Section>

        <Section title="Skills">
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not added yet</p>
          )}
        </Section>

        <Section title="Education" className="mb-0">
          {education.length > 0 ? (
            <div className="space-y-3">
              {education.map((e) => (
                <p key={e.id} className="text-sm text-foreground">
                  <b>{e.qualification}, {e.institution}</b>
                  {e.end_year ? ` · ${e.end_year}` : ""}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not added yet</p>
          )}
        </Section>
      </article>
    </AppShell>
  );
}
