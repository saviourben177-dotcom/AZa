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
 * Tailors an existing base CV toward a specific opportunity's eligibility/description,
 * re-ordering and re-emphasizing content. Does not fabricate new facts.
 */
export async function tailorCvForOpportunity(
  baseCvMarkdown: string,
  opportunity: { title: string; org: string; description: string; eligibility: string | null }
): Promise<string> {
  const prompt = `You are tailoring an existing CV for a specific opportunity application. Re-order and re-emphasize existing content so the most relevant skills/experience/education appear first and are framed in language that matches the opportunity's eligibility criteria and description. You may rephrase bullet points for relevance and tone. You must NOT invent new facts, employers, dates, or qualifications that are not in the original CV.

Opportunity:
Title: ${opportunity.title}
Organization: ${opportunity.org}
Description: ${opportunity.description}
Eligibility: ${opportunity.eligibility ?? "Not specified"}

Original CV (Markdown):
${baseCvMarkdown}

Output the tailored CV as clean Markdown, same overall structure as the original.`;

  return groqChat({
    model: TEXT_MODEL,
    temperature: 0.4,
    max_completion_tokens: 1800,
    messages: [{ role: "user", content: prompt }],
  });
}
