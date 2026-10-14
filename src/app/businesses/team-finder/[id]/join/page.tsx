"use client";

import { use } from "react";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, Form, SelectField, TextArea, TextField } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import { teamPosts } from "@/lib/aza-data";
import { api } from "@/lib/aza/api";

export default function JoinTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = teamPosts.find((x) => x.id === id);

  return (
    <AppShell>
      <BackLink to="/businesses/team-finder" label="Team Finder" />
      <PageHeader title="Request to join" sub={t?.name ?? ""} />
      <Form
        onSubmit={(d) => api.sendJoinRequest(id, d)}
        submitLabel="Send request"
        success="Request sent"
        cancelTo="/businesses/team-finder"
      >
        <SelectField label="Role" name="role" options={t?.roles ?? ["Any"]} />
        <TextArea label="Why you?" name="note" required />
        <TextField label="Portfolio or LinkedIn" name="link" type="url" />
      </Form>
    </AppShell>
  );
}
