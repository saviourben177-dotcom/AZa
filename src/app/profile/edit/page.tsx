"use client";

import { AppShell } from "@/components/aza/app-shell";
import { BackLink, Form, TextArea, TextField } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import { me } from "@/lib/aza-data";
import { api } from "@/lib/aza/api";

export default function EditProfilePage() {
  return (
    <AppShell>
      <BackLink to="/profile" label="Profile" />
      <PageHeader title="Edit profile" />
      <Form
        onSubmit={api.updateProfile}
        submitLabel="Save changes"
        success="Profile updated"
        cancelTo="/profile"
      >
        <TextField label="Full name" name="name" required defaultValue={me.name} />
        <TextField label="Role" name="role" defaultValue={me.role ?? ""} />
        <TextField label="Location" name="location" defaultValue={me.location ?? ""} />
        <TextArea label="Bio" name="bio" />
      </Form>
    </AppShell>
  );
}
