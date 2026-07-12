"use server";

import { createClient } from "@/lib/supabase/server";
import { askGrowthAssistant } from "@/lib/groq";

// Common English/Nigerian-context stopwords that add noise to keyword search without adding
// signal (e.g. "find me something about design" should really search "design").
const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "for", "to", "of", "in", "on", "at",
  "me", "i", "my", "about", "with", "and", "or", "find", "show", "search", "any",
  "something", "anything", "help", "want", "need", "looking", "can", "you",
]);

function extractSearchTerms(question: string): string[] {
  const words = question
    .toLowerCase()
    .replace(/[,.():?!]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  // De-dupe while preserving order, cap at 5 terms to keep the OR-filter query reasonable
  return Array.from(new Set(words)).slice(0, 5);
}

export async function askGrowthHub(question: string): Promise<{ answer: string; hasResults: boolean }> {
  const trimmed = question.trim();
  if (trimmed.length === 0) throw new Error("Question cannot be empty");
  if (trimmed.length > 300) throw new Error("Question is too long");

  const supabase = await createClient();
  const terms = extractSearchTerms(trimmed);

  // Fall back to the full (sanitized) phrase if stopword-stripping left nothing searchable
  // (e.g. the question was just "help me" — unlikely to be useful, but don't crash on it).
  const safeFullQuery = trimmed.replace(/[,.():]/g, " ").trim();
  const searchTerms = terms.length > 0 ? terms : [safeFullQuery];

  // Build an OR clause across title/description/org/eligibility/tags for each term, so a
  // multi-word question like "web design internship" matches opportunities containing any of
  // those words in any of those fields, rather than requiring the exact phrase as one substring.
  const oppOrClauses = searchTerms.flatMap((term) => {
    const like = `%${term}%`;
    return [`title.ilike.${like}`, `description.ilike.${like}`, `org.ilike.${like}`, `eligibility.ilike.${like}`, `tags.cs.{${term}}`];
  });
  const resourceOrClauses = searchTerms.flatMap((term) => [`title.ilike.%${term}%`, `provider.ilike.%${term}%`]);
  const ideaOrClauses = searchTerms.flatMap((term) => [`title.ilike.%${term}%`, `description.ilike.%${term}%`]);

  const [{ data: opportunities }, { data: resources }, { data: ideas }] = await Promise.all([
    supabase
      .from("opportunities")
      .select("id, title, org, category, description, eligibility, deadline, tags")
      .or(oppOrClauses.join(","))
      .order("deadline", { ascending: true, nullsFirst: false })
      .limit(20),
    supabase
      .from("skill_resources")
      .select("id, title, provider, skills(name)")
      .or(resourceOrClauses.join(","))
      .limit(20),
    supabase
      .from("ideas")
      .select("id, title, description")
      .eq("visibility", "public")
      .or(ideaOrClauses.join(","))
      .limit(20),
  ]);

  // Relevance ranking: count how many search terms each row actually matches across its
  // searchable fields, so a row hitting 2 of 3 words ranks above one hitting only 1 — plain
  // ILIKE with no ranking would return results in arbitrary/insertion order instead.
  function scoreOpportunity(o: { title: string; description: string; org: string; eligibility: string | null; tags: string[] }): number {
    const haystack = `${o.title} ${o.description} ${o.org} ${o.eligibility ?? ""} ${o.tags.join(" ")}`.toLowerCase();
    return searchTerms.reduce((acc, term) => acc + (haystack.includes(term) ? 1 : 0), 0);
  }
  function scoreResource(r: { title: string; provider: string | null }): number {
    const haystack = `${r.title} ${r.provider ?? ""}`.toLowerCase();
    return searchTerms.reduce((acc, term) => acc + (haystack.includes(term) ? 1 : 0), 0);
  }
  function scoreIdea(i: { title: string; description: string }): number {
    const haystack = `${i.title} ${i.description}`.toLowerCase();
    return searchTerms.reduce((acc, term) => acc + (haystack.includes(term) ? 1 : 0), 0);
  }

  const rankedOpportunities = (opportunities ?? [])
    .map((o) => ({ o, score: scoreOpportunity(o) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((x) => x.o);

  const rankedResources = (resources ?? [])
    .map((r) => ({ r, score: scoreResource(r) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((x) => x.r);

  const rankedIdeas = (ideas ?? [])
    .map((i) => ({ i, score: scoreIdea(i) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((x) => x.i);

  const result = await askGrowthAssistant(trimmed, {
    opportunities: rankedOpportunities.map((o) => ({
      id: o.id,
      title: o.title,
      org: o.org,
      category: o.category,
      deadline: o.deadline,
    })),
    resources: rankedResources.map((r) => ({
      id: r.id,
      title: r.title,
      provider: r.provider,
      skill: (r.skills as unknown as { name: string } | null)?.name ?? "General",
    })),
    ideas: rankedIdeas.map((i) => ({ id: i.id, title: i.title, description: i.description })),
  });

  return result;
}
