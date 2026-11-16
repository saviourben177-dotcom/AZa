-- Skill checkpoints: real multiple-choice quizzes, and an explicit
-- checkpoint_type instead of inferring behavior from requires_submission
-- alone.
--
-- Why: every lesson-only checkpoint (requires_submission = false) rendered
-- with no way to advance at all — the page only ever showed a submission
-- form when requires_submission was true, and the "mark done" button that
-- existed in code was never wired into the page. That bug affected every
-- skill path in the catalog except client-acquisition. Separately, the
-- "Quick Check" checkpoints (classify five jobs, safe vs unsafe, etc.) were
-- free-text boxes graded by an AI call against a prose evaluation_criteria
-- string — slow, costly per attempt, and not an actual quiz. This migration
-- adds real multiple-choice quiz support, graded deterministically with no
-- AI call, and a type column that says plainly what each checkpoint is.

alter table public.skill_checkpoints
  add column checkpoint_type text not null default 'lesson'
    check (checkpoint_type in ('lesson', 'quiz', 'submission'));

comment on column public.skill_checkpoints.checkpoint_type is
  'lesson = read content, mark done, no grading. quiz = multiple-choice questions in quiz_questions, graded deterministically, no AI call. submission = free-text/link graded by AI against evaluation_criteria (reserved for genuinely open-ended work, e.g. the final project). Replaces the old requires_submission-only distinction, which made lesson checkpoints (requires_submission=false) and quiz checkpoints both render the same way and both had no path to completion.';

-- Backfill from the old boolean so existing rows classify correctly:
-- requires_submission = false -> lesson, true -> submission (every
-- existing "true" checkpoint was free-text, since quiz_questions doesn't
-- exist yet for any row). The content rewrite that follows this migration
-- reclassifies the actual "Quick Check" checkpoints to 'quiz' and fills in
-- quiz_questions.
update public.skill_checkpoints
  set checkpoint_type = case when requires_submission then 'submission' else 'lesson' end;

-- One multiple-choice question: { "question": text, "options": [text, ...],
-- "correct_index": int, "explanation": text (optional, shown after answering) }.
-- quiz_questions is an array of these. Passing threshold (all correct, or a
-- score cutoff) is enforced in the grading server action, not the DB.
alter table public.skill_checkpoints
  add column quiz_questions jsonb not null default '[]'::jsonb;

comment on column public.skill_checkpoints.quiz_questions is
  'Array of {question, options[], correct_index, explanation?} for checkpoint_type = quiz. Graded entirely server-side with no AI call: deterministic, instant, free. Empty for lesson/submission checkpoints.';

-- requires_submission stays for now (the submission-form / submitCheckpoint
-- code path still reads it) but is superseded by checkpoint_type = 'submission'
-- going forward; new code should check checkpoint_type, not this column.
comment on column public.skill_checkpoints.requires_submission is
  'Superseded by checkpoint_type (see above) but kept for backward compatibility with existing submission-grading code. true should always match checkpoint_type = ''submission'' going forward; new checkpoints should set checkpoint_type directly and leave this to match.';
