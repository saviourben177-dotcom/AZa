// Server-only Groq client. Never import this from a "use client" file —
// it reads GROQ_API_KEY directly and must not reach the browser bundle.
//
// Vision model: handles passport/credential image OCR.
// Text model: handles CV prose generation and per-opportunity tailoring.
// Both are called via Groq's OpenAI-compatible chat completions endpoint.

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const TEXT_MODEL = "llama-3.3-70b-versatile";

function requireApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not configured");
  return key;
}

async function groqChat(params: {
  model: string;
  messages: unknown[];
  temperature?: number;
  max_completion_tokens?: number;
  response_format?: { type: "json_object" };
}): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireApiKey()}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.4,
      max_completion_tokens: params.max_completion_tokens ?? 1500,
      ...(params.response_format ? { response_format: params.response_format } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq API error (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Groq API returned no content");
  return content;
}

/**
 * Runs OCR + structured extraction on a single credential/passport image.
 * Image must already be a base64 data URL (image/jpeg, image/png, or image/webp) —
 * PDFs must be rasterized to an image before calling this.
 */
export async function extractCredentialFromImage(
  imageDataUrl: string,
  docType: "credential" | "passport"
): Promise<{
  document_kind: string | null;
  institution: string | null;
  qualification: string | null;
  field_of_study: string | null;
  year: string | null;
  grade: string | null;
  raw_text_snippet: string | null;
}> {
  const instructions =
    docType === "passport"
      ? `This is a passport or government ID photo page. Extract only the full name as it appears, if clearly legible. Do not extract or repeat any ID/passport number, date of birth, or other sensitive identifiers. Respond with JSON only: {"document_kind": "passport", "institution": null, "qualification": null, "field_of_study": null, "year": null, "grade": null, "raw_text_snippet": "<full name only, or null if illegible>"}`
      : `This is an academic or professional credential document (certificate, transcript, diploma, etc.). Extract: the type of document, issuing institution, qualification/degree name, field of study if present, year of completion/issue, and grade/result if present. Respond with JSON only, matching this exact shape: {"document_kind": string|null, "institution": string|null, "qualification": string|null, "field_of_study": string|null, "year": string|null, "grade": string|null, "raw_text_snippet": string|null}. raw_text_snippet should be a short (under 200 char) excerpt of the most identifying line of text, for the user to visually verify the OCR against the original. If a field is not visible or not applicable, use null. Do not guess or invent values.`;

  const content = await groqChat({
    model: VISION_MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: instructions },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
  });

  try {
    return JSON.parse(content);
  } catch {
    return {
      document_kind: null,
      institution: null,
      qualification: null,
      field_of_study: null,
      year: null,
      grade: null,
      raw_text_snippet: null,
    };
  }
}

interface CvInputData {
  fullName: string | null;
  fieldOfInterest: string | null;
  highestQualification: string | null;
  region: string | null;
  summary: string | null;
  education: unknown[];
  experience: unknown[];
  certifications: unknown[];
  skills: string[];
}

/**
 * Generates the base CV body (markdown) from structured profile + CV data.
 */
export async function generateBaseCv(input: CvInputData): Promise<string> {
  const prompt = `You are writing a professional CV/résumé for a job/opportunity-seeking platform user in Nigeria. Use only the information provided below — never invent employers, dates, qualifications, or achievements not present in the data. If a section has no data, omit it entirely rather than padding it.

Output clean Markdown with these sections where data exists: a 2-3 sentence professional summary at the top (write or lightly polish from the provided summary), Education, Experience, Certifications, Skills. Use standard CV tone: concise, achievement-oriented, no first-person pronouns in bullet points.

User data:
${JSON.stringify(input, null, 2)}`;

  return groqChat({
    model: TEXT_MODEL,
    temperature: 0.5,
    max_completion_tokens: 1800,
    messages: [{ role: "user", content: prompt }],
  });
}

/**
 * Growth Hub's "Ask me anything" assistant. This is retrieval-grounded, not a raw chat: we
 * search real opportunities/skill_resources/ideas for the query first, then ask the model to
 * answer using ONLY that retrieved context. This deliberately avoids letting the model invent
 * opportunities, deadlines, or resources that don't exist in AZA's own data — a raw ungrounded
 * chat would eventually hallucinate a scholarship or deadline that sounds plausible but isn't
 * real, which is a serious trust problem for a platform whose whole purpose is real listings.
 */
export async function askGrowthAssistant(
  question: string,
  context: {
    opportunities: { id: string; title: string; org: string; category: string; deadline: string | null }[];
    resources: { id: string; title: string; provider: string | null; skill: string }[];
    ideas: { id: string; title: string; description: string }[];
  }
): Promise<{ answer: string; hasResults: boolean }> {
  const hasResults =
    context.opportunities.length > 0 || context.resources.length > 0 || context.ideas.length > 0;

  if (!hasResults) {
    // Nothing relevant found in AZA's own data — say so honestly rather than asking the
    // model to answer from general knowledge, which would break the grounding guarantee.
    return {
      answer:
        "I couldn't find anything in AZA matching that right now. Try browsing Discover or Skills directly, or rephrase your question.",
      hasResults: false,
    };
  }

  const contextBlock = [
    context.opportunities.length > 0
      ? `Opportunities:\n${context.opportunities
          .map((o) => `- [${o.id}] "${o.title}" at ${o.org} (${o.category})${o.deadline ? `, deadline ${o.deadline}` : ""}`)
          .join("\n")}`
      : "",
    context.resources.length > 0
      ? `Skill resources:\n${context.resources
          .map((r) => `- [${r.id}] "${r.title}" (${r.skill})${r.provider ? ` by ${r.provider}` : ""}`)
          .join("\n")}`
      : "",
    context.ideas.length > 0
      ? `Ideas:\n${context.ideas.map((i) => `- [${i.id}] "${i.title}": ${i.description.slice(0, 120)}`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const prompt = `You are AZA's Growth Hub assistant, helping a Nigerian youth user find opportunities, skills resources, and ideas within the AZA app. Answer the user's question using ONLY the items listed below — these are real items that exist in AZA right now. Do not mention or invent anything not in this list. If nothing below actually answers the question, say so honestly instead of stretching an unrelated item to fit. Keep the answer short (2-4 sentences), warm, and direct. Refer to items by name, not by their [id].

User's question: ${question}

Available AZA items:
${contextBlock}`;

  const answer = await groqChat({
    model: TEXT_MODEL,
    temperature: 0.3,
    max_completion_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  return { answer, hasResults: true };
}

/**
 * Tailors an existing base CV toward a specific opportunity's eligibility/description,
 * re-ordering and re-emphasizing content. Does not fabricate new facts.
 * Also produces a 0-100 match score in the same call (single API cost, single round trip).
 */
export async function tailorCvForOpportunity(
  baseCvMarkdown: string,
  opportunity: { title: string; org: string; description: string; eligibility: string | null }
): Promise<{ content: string; matchScore: number | null }> {
  const prompt = `You are tailoring an existing CV for a specific opportunity application. Re-order and re-emphasize existing content so the most relevant skills/experience/education appear first and are framed in language that matches the opportunity's eligibility criteria and description. You may rephrase bullet points for relevance and tone. You must NOT invent new facts, employers, dates, or qualifications that are not in the original CV.

Also assess how well the ORIGINAL (untailored) CV's actual experience/education/skills match this opportunity's stated eligibility and description, as a 0-100 integer. Base this strictly on genuine overlap between what's in the CV and what the opportunity asks for — do not inflate it just because you rephrased the CV. If eligibility is not specified, judge based on the description alone.

Opportunity:
Title: ${opportunity.title}
Organization: ${opportunity.org}
Description: ${opportunity.description}
Eligibility: ${opportunity.eligibility ?? "Not specified"}

Original CV (Markdown):
${baseCvMarkdown}

Respond with JSON only, in this exact shape:
{"content": "<the tailored CV as clean Markdown, same overall structure as the original>", "match_score": <integer 0-100>}`;

  const raw = await groqChat({
    model: TEXT_MODEL,
    temperature: 0.4,
    max_completion_tokens: 2200,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  try {
    const parsed = JSON.parse(raw);
    const content = typeof parsed.content === "string" ? parsed.content : raw;
    const scoreRaw = parsed.match_score;
    const matchScore =
      typeof scoreRaw === "number" && Number.isFinite(scoreRaw)
        ? Math.max(0, Math.min(100, Math.round(scoreRaw)))
        : null;
    return { content, matchScore };
  } catch {
    // Model didn't return valid JSON — fall back to treating the whole response as
    // the CV content with no score, rather than losing the tailoring output entirely.
    return { content: raw, matchScore: null };
  }
}
