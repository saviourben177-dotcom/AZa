"use client";

import { AppShell } from "@/components/aza/app-shell";
import { BackLink, Form, TextArea, TextField } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import { api } from "@/lib/aza/api";

export default function EditCvPage() {
  return (
    <AppShell>
      <BackLink to="/profile/cv" label="CV" />
      <PageHeader title="Edit CV" />
      <Form
        onSubmit={api.updateCv}
        submitLabel="Save CV"
        success="CV saved"
        cancelTo="/profile/cv"
      >
        <TextArea label="Summary" name="summary" rows={3} />
        <TextArea label="Experience" name="experience" hint="One role per line" />
        <TextArea label="Education" name="education" rows={3} />
        <TextArea label="Projects" name="projects" rows={3} />
        <TextField label="Skills" name="skills" hint="Comma separated" />
      </Form>
    </AppShell>
  );
}
