"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, Form, SelectField, TextArea, TextField, btn } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import { api } from "@/lib/aza/api";

export default function BusinessPlanPage() {
  const [plan, setPlan] = useState<string | null>(null);

  return (
    <AppShell>
      <BackLink to="/businesses" label="Business" />
      <PageHeader
        title="Business plan"
        sub="Answer five questions, get a draft you can edit"
      />
      <Form
        onSubmit={async (d) => {
          const res = await api.generateBusinessPlan(d);
          setPlan(res.plan);
        }}
        submitLabel="Generate plan"
        success="Draft plan ready"
      >
        <TextField label="Business name" name="name" required />
        <SelectField
          label="Industry"
          name="industry"
          options={["Agriculture", "Food", "Retail", "Tech", "Energy", "Services"]}
        />
        <TextArea label="What problem do you solve?" name="problem" required />
        <TextArea label="Who are your customers?" name="customers" rows={3} />
        <TextField label="Startup budget" name="budget" placeholder="₦" />
      </Form>

      {plan && (
        <section className="mt-8 max-w-2xl rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-display font-bold text-foreground">Your draft plan</h2>
            <button
              type="button"
              className={btn.secondary}
              onClick={() => {
                navigator.clipboard?.writeText(plan);
                toast.success("Copied");
              }}
            >
              Copy
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{plan}</p>
        </section>
      )}
    </AppShell>
  );
}
