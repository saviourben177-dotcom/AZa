# Skill path import template

Give this file (or just the JSON block below) to any LLM writing content
for a sector. Import at `/admin/skills` — JSON only.

## Format

A `.json` file containing an **array of skill paths**. Each path is
self-contained with its checkpoints nested inside. One file can hold
several paths (e.g. beginner/intermediate/advanced for one sector), or just
one.

**How it self-sorts:** each path is matched by its `slug` (must be unique,
lowercase-with-hyphens). If that slug doesn't exist yet, a new path is
created; if it does, the existing path is updated in place. Each checkpoint
is matched the same way by its `order` number within the path — so you can
re-import a corrected file for a path you already loaded and it updates
rather than duplicates.

## Required fields

**Path:** `slug`, `title`, `category`, `checkpoints` (at least 1)
**Checkpoint:** `order`, `title`, `content_by_style` (at least one style
filled in — `entertaining` / `focused` / `practical`)

Everything else has a sensible default (see schema) or is optional.

## Worked example

```json
[
  {
    "slug": "ai-foundations-beginner",
    "title": "AI Foundations",
    "category": "ai",
    "summary": "What large language models actually are, and how to use them without getting burned.",
    "output_kind": "capability",
    "tier": "free",
    "estimated_weeks": 2,
    "checkpoints": [
      {
        "order": 1,
        "title": "What LLMs Actually Are (and Aren't)",
        "description": "A no-hype grounding in what large language models can and can't do.",
        "learning_points": [
          "The difference between classic NLP tasks and modern LLMs",
          "Four real capabilities of LLMs",
          "Four real limitations you must plan around"
        ],
        "content_by_style": {
          "practical": "Before you build anything with AI, get this straight: an LLM predicts likely next words — it doesn't \"know\" things the way a database does.\n\nWhat makes LLMs different: scale, general-purpose use, in-context learning, emergent behavior.\n\nWhat you must plan around: hallucination, bias, context limits, cost.\n\n*Adapted from the Hugging Face Course (huggingface/course), licensed under Apache 2.0.*"
        },
        "is_final": false,
        "requires_submission": true,
        "evaluation_criteria": "Pass if the learner can name at least 2 capabilities AND at least 2 limitations of LLMs in their own words."
      },
      {
        "order": 2,
        "title": "Build Your First Prompt Workflow",
        "learning_points": ["Structuring a prompt", "Iterating on output", "Recognizing a hallucinated answer"],
        "content_by_style": {
          "practical": "..."
        },
        "is_final": true,
        "requires_submission": true,
        "evaluation_criteria": "Learner submits a real prompt + output pair and explains one thing they'd change about the prompt."
      }
    ]
  }
]
```

## Attribution note

If any checkpoint content is adapted from an open-source source (even under
a permissive license like Apache 2.0, MIT, or CC0), put the attribution
line directly inside that checkpoint's `content_by_style` text, the way the
example above does. Don't rely on a separate field — the content and its
attribution should travel together.
