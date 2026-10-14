"use client";

import { AppShell } from "@/components/aza/app-shell";
import { BackLink, Form, SelectField, TextArea, TextField } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import { api } from "@/lib/aza/api";

export default function NewListingPage() {
  return (
    <AppShell>
      <BackLink to="/businesses/marketplace" label="Marketplace" />
      <PageHeader title="Post a listing" />
      <Form
        onSubmit={api.createListing}
        submitLabel="Post listing"
        success="Listing posted"
        cancelTo="/businesses/marketplace"
      >
        <SelectField
          label="Type"
          name="type"
          options={["Sell", "Buy", "Service", "Collaborate"]}
        />
        <TextField label="Title" name="title" required />
        <TextField label="Price" name="price" hint="Optional" placeholder="₦" />
        <TextField label="Location" name="location" required />
        <TextArea label="Details" name="body" required />
      </Form>
    </AppShell>
  );
}
