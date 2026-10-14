"use client";

import { useRouter } from "next/navigation";
import { BareShell, Checkbox, Form, SelectField, TextField } from "@/components/aza/kit";
import { api } from "@/lib/aza/api";

export default function OnboardingForm({ initialFullName }: { initialFullName: string | null }) {
  const router = useRouter();

  return (
    <BareShell narrow>
      <p className="text-sm font-bold uppercase tracking-wide text-primary-strong">
        Step 1 of 1
      </p>
      <h1 className="mb-6 mt-1 text-3xl font-display font-bold text-foreground">
        What are you looking for?
      </h1>
      <Form
        onSubmit={async (d) => {
          await api.completeOnboarding(d);
          router.push("/welcome");
        }}
        submitLabel="Continue"
        success="Profile set up"
      >
        <TextField
          label="Full name"
          name="name"
          required
          defaultValue={initialFullName ?? ""}
          placeholder="e.g. Ada Obi"
        />
        <TextField label="Location" name="location" required placeholder="e.g. Lagos" />
        <SelectField
          label="I am a"
          name="role"
          options={["Student", "Graduate", "Founder", "Freelancer"]}
        />
        <Checkbox label="Grants & funding" name="grants" defaultChecked />
        <Checkbox label="Scholarships" name="scholarships" />
        <Checkbox label="Internships & jobs" name="jobs" />
        <Checkbox label="Co-founders & teams" name="teams" />
      </Form>
    </BareShell>
  );
}
