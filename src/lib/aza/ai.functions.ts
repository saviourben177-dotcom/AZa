"use server";

// Server-only Groq calls. GROQ_API_KEY never reaches the browser.
const MODEL = "openai/gpt-oss-120b";

async function groq(system: string, user: string) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("AI is not configured yet.");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (res.status === 429) throw new Error("The assistant is busy right now. Try again in a minute.");
  if (!res.ok) {
    console.error("Groq error", res.status, await res.text());
    throw new Error("The assistant couldn't answer right now.");
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("The assistant returned an empty answer.");
  return text;
}

export async function askGrowthAssistant(input: { data: { question: string } } | { question: string }) {
  const question = "data" in input ? input.data.question : input.question;
  const q = String(question ?? "").trim();
  if (!q) throw new Error("Question cannot be empty");
  if (q.length > 300) throw new Error("Question is too long");

  const answer = await groq(
    "You are Aza's Growth Assistant for young people and founders in Africa. Give practical, concise advice (under 180 words) on skills, free courses, career opportunities and small-business ideas. Prefer free, locally accessible options. Plain text, short paragraphs or simple dashes.",
    q,
  );
  return { answer, hasResults: true };
}

export async function generateBusinessPlan(input: {
  data: { name: string; industry: string; problem: string; customers: string; budget: string };
} | { name: string; industry: string; problem: string; customers: string; budget: string }) {
  const d = "data" in input ? input.data : input;
  const s = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const name = s(d?.name, 100);
  const industry = s(d?.industry, 50);
  const problem = s(d?.problem, 1000);
  const customers = s(d?.customers, 600);
  const budget = s(d?.budget, 50);

  if (!name || !problem) throw new Error("Business name and problem are required");

  const plan = await groq(
    "You write clear, realistic one-page business plans for small businesses in Africa (Nigeria by default, Naira). Use these headings on their own lines: Summary, Problem, Solution, Customers, Revenue model, Startup costs, First 90 days, Risks. Under each, 2-4 short dash bullet points. Plain text only, no markdown symbols other than dashes.",
    `Business: ${name}\nIndustry: ${industry}\nProblem: ${problem}\nCustomers: ${customers || "not given"}\nStartup budget: ${budget || "not given"}`,
  );
  return { plan };
}
