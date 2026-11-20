import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/aza/app-shell";
import { BackLink } from "@/components/aza/kit";
import QuizFlow, { type PrepQuestion } from "./quiz-flow";

export const dynamic = "force-dynamic";

const QUESTIONS_PER_ATTEMPT = 5;

/** Fisher-Yates shuffle — used so each attempt pulls a different subset/order from the field's question bank rather than always the same first N. */
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default async function PrepFieldPage({ params }: { params: Promise<{ fieldSlug: string }> }) {
  const { fieldSlug } = await params;
  const supabase = await createClient();

  const { data: field } = await supabase
    .from("prep_fields")
    .select("*")
    .eq("slug", fieldSlug)
    .eq("is_published", true)
    .maybeSingle();

  if (!field) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // prep_questions_public never exposes correct_option_index — grading
  // happens entirely server-side in grade_prep_attempt() (see the schema
  // migration), so there's no answer key to leak here even though this
  // runs on the server.
  const { data: allQuestions } = await supabase
    .from("prep_questions_public")
    .select("*")
    .eq("field_id", field.id)
    .eq("is_published", true);

  // prep_questions_public's generated type marks every column nullable
  // (a view-vs-base-table quirk — none of these are ever actually null
  // in a published row), so normalize into a fully non-null shape here,
  // once, rather than scattering null-checks through the client
  // component. A row missing something essential is dropped rather than
  // risking a broken quiz question rendering.
  const questions: PrepQuestion[] = shuffle(allQuestions ?? [])
    .slice(0, QUESTIONS_PER_ATTEMPT)
    .flatMap((q): PrepQuestion[] => {
      if (!q.id || !q.field_id || !q.prompt || !q.options || !q.difficulty) return [];
      return [
        {
          id: q.id,
          field_id: q.field_id,
          prompt: q.prompt,
          options: q.options as unknown as string[],
          explanation: q.explanation,
          difficulty: q.difficulty,
        },
      ];
    });

  return (
    <AppShell>
      <BackLink to="/growth/prep" label="Prep" />
      <QuizFlow field={field} questions={questions} isAuthed={!!user} />
    </AppShell>
  );
}
