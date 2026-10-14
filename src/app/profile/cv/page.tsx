import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, btn, Progress, Section } from "@/components/aza/kit";
import { PageHeader, Tag } from "@/components/aza/ui";
import { me } from "@/lib/aza-data";
import { createClient } from "@/lib/supabase/server";

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

  let name = me.name;
  let role = me.role;
  let location = me.location;
  let summary = "Self-taught builder focused on education tools for students across Nigeria.";

  if (user) {
    const [{ data: p }, { data: cv }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("cv_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    if (p) {
      if (p.full_name) name = p.full_name;
      if (p.job_title) role = p.job_title;
      if (p.exact_location) location = p.exact_location;
    }
    if (cv?.summary) summary = cv.summary;
  }

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
        <p className="mb-2 text-sm font-bold text-primary-strong">60% complete</p>
        <Progress value={60} />
      </div>
      <article className="max-w-2xl rounded-lg border bg-card p-6 shadow-[var(--shadow-lift)]">
        <h2 className="text-2xl font-display font-bold text-foreground">{name}</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {role} · {location}
        </p>
        <Section title="Summary">
          <p className="text-sm leading-relaxed text-foreground">{summary}</p>
        </Section>
        <Section title="Experience">
          <p className="text-sm text-foreground">
            <b>Founder, WhatsApp JAMB tutor</b> · 2025 – now
          </p>
        </Section>
        <Section title="Skills">
          <div className="flex flex-wrap gap-1.5">
            {["Product design", "Python", "Bookkeeping"].map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </div>
        </Section>
        <Section title="Education" className="mb-0">
          <p className="text-sm text-muted-foreground">Not added yet</p>
        </Section>
      </article>
    </AppShell>
  );
}
