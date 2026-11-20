import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink, Empty } from "@/components/aza/kit";
import { PageHeader } from "@/components/aza/ui";
import CoinBadge from "@/components/aza/coin-badge";
import { resolveFieldIcon } from "./field-icon";
import { suggestGrowthDefaults } from "@/lib/growth-personalization";

export const dynamic = "force-dynamic";

export default async function PrepPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: fields }, countsResult, coinResult, profileResult] = await Promise.all([
    supabase
      .from("prep_fields")
      .select("*")
      .eq("is_published", true)
      .order("sort_order"),
    supabase.from("prep_questions_public").select("field_id"),
    user ? supabase.from("user_coins").select("balance").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("profiles")
          .select("field_of_interest, industry, business_description, freelance_skill, skilled_or_unskilled")
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const questionCounts = new Map<string, number>();
  for (const row of countsResult.data ?? []) {
    if (!row.field_id) continue; // the view's field_id is nullable by type, though never actually null in practice
    questionCounts.set(row.field_id, (questionCounts.get(row.field_id) ?? 0) + 1);
  }

  const coinBalance = coinResult.data?.balance ?? 0;
  const suggestedSlug = suggestGrowthDefaults(profileResult.data).prepFieldSlug;

  return (
    <AppShell>
      <BackLink to="/growth" label="Growth" />
      <PageHeader
        title="Prep"
        sub="Interview ready"
        action={user ? <CoinBadge balance={coinBalance} /> : undefined}
      />

      {!fields || fields.length === 0 ? (
        <Empty title="No Prep fields yet" sub="Check back soon." />
      ) : (
        <div className="space-y-2.5">
          {fields.map((field) => {
            const Icon = resolveFieldIcon(field.icon);
            const count = questionCounts.get(field.id) ?? 0;
            const isSuggested = suggestedSlug === field.slug;
            return (
              <Link
                key={field.id}
                href={`/growth/prep/${field.slug}`}
                className={`card-lift flex items-center gap-3 rounded-lg border bg-card p-4 ${
                  isSuggested ? "border-primary" : ""
                }`}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-strong">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-display font-bold text-foreground">{field.name}</p>
                    {isSuggested ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary-strong">
                        <Sparkles className="size-3" /> For you
                      </span>
                    ) : null}
                  </div>
                  {field.description ? (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{field.description}</p>
                  ) : null}
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {count} question{count === 1 ? "" : "s"}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
