import { GoogleGenAI, Type } from "@google/genai";
import type { FormData } from "./types";

// The structured plan the model must return (spec §7).
export type GeneratedPlan = {
  price_min: number;
  price_max: number;
  currency: string;
  plan_markdown: string;
  recommended_path: "email_plan" | "book_maia" | "dig_deeper";
  rationale: string;
};

const MODEL = "gemini-2.5-flash";

export const isGeminiConfigured = Boolean(process.env.GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `You are the project-planning assistant for Digitalfeet, a Norwegian web and digital agency. A prospective client has described their situation through a short form. Produce a concise, concrete project plan and an honest price range in Norwegian kroner (NOK).

Price anchoring — bound your range roughly by these two reference products:
- "Quick Launch" ≈ 60,000 NOK (~80 hours): a focused, mostly template-driven site or launch.
- "Custom Build" ≈ 110,000 NOK (~150 hours): a bespoke, custom-designed build.
Simple needs sit near the Quick Launch anchor; complex or highly custom needs sit near — or somewhat above — the Custom Build anchor. NEVER return a single fixed number: always a range where price_min is clearly less than price_max.

Plan guidance: write plan_markdown as a short, scannable markdown plan tailored to THEIR situation — a one-line summary, then 3–6 concrete phases or steps, then a brief "What's included" list. Keep it concrete and specific; avoid filler and generic boilerplate. Do not invent facts about the client beyond what they provided.

Recommend exactly one path:
- "email_plan": their need is clear and self-contained; they can take the plan and run with it.
- "book_maia": there's enough nuance or budget that a conversation with us would help.
- "dig_deeper": the brief is vague or early-stage; they should explore/refine before committing.
Give a one-sentence rationale for the recommendation.

Return ONLY JSON matching the provided schema.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    price_min: { type: Type.INTEGER },
    price_max: { type: Type.INTEGER },
    currency: { type: Type.STRING },
    plan_markdown: { type: Type.STRING },
    recommended_path: {
      type: Type.STRING,
      enum: ["email_plan", "book_maia", "dig_deeper"],
    },
    rationale: { type: Type.STRING },
  },
  required: [
    "price_min",
    "price_max",
    "currency",
    "plan_markdown",
    "recommended_path",
    "rationale",
  ],
  propertyOrdering: [
    "price_min",
    "price_max",
    "currency",
    "plan_markdown",
    "recommended_path",
    "rationale",
  ],
};

function buildUserPrompt(data: FormData, siteText: string | null): string {
  const lines = [
    "Here is the prospective client's submission. Build their plan.",
    "",
    `Situation (their own words): ${data.situation}`,
    `Project type: ${data.projectType}`,
    `Rough budget band: ${data.budgetBand}`,
    `Timeline: ${data.timeline}`,
    `Company / project: ${data.company}`,
    `Industry: ${data.industry}`,
    `Team size: ${data.teamSize}`,
    data.url ? `Current website: ${data.url}` : "Current website: (none provided)",
  ];
  if (siteText) {
    lines.push(
      "",
      "Extracted text from their current website (truncated, for context only):",
      `"""${siteText}"""`
    );
  }
  return lines.join("\n");
}

function isValidPlan(value: unknown): value is GeneratedPlan {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.price_min === "number" &&
    typeof p.price_max === "number" &&
    typeof p.currency === "string" &&
    typeof p.plan_markdown === "string" &&
    (p.recommended_path === "email_plan" ||
      p.recommended_path === "book_maia" ||
      p.recommended_path === "dig_deeper") &&
    typeof p.rationale === "string"
  );
}

function normalizePlan(plan: GeneratedPlan): GeneratedPlan {
  let { price_min, price_max } = plan;
  price_min = Math.max(0, Math.round(price_min));
  price_max = Math.max(0, Math.round(price_max));
  // Guard against the model flipping or collapsing the range.
  if (price_max < price_min) [price_min, price_max] = [price_max, price_min];
  if (price_max === price_min) price_max = Math.round(price_min * 1.3);
  return {
    ...plan,
    price_min,
    price_max,
    currency: plan.currency?.trim() || "NOK",
  };
}

async function callModel(
  ai: GoogleGenAI,
  data: FormData,
  siteText: string | null
): Promise<{ plan: GeneratedPlan; raw: unknown }> {
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: buildUserPrompt(data, siteText),
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.6,
      // Disable "thinking" so the entire token budget goes to the JSON answer
      // (otherwise thinking tokens can truncate the response). Keeps latency low.
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: 2048,
    },
  });

  const text = res.text;
  if (!text) throw new Error("Empty response from model.");
  const parsed = JSON.parse(text) as unknown;
  if (!isValidPlan(parsed)) {
    throw new Error("Model returned JSON that did not match the plan schema.");
  }
  return { plan: normalizePlan(parsed), raw: parsed };
}

// Generates a plan, retrying once on malformed/invalid output (spec §7).
export async function generatePlan(
  data: FormData,
  siteText: string | null
): Promise<{ plan: GeneratedPlan; raw: unknown }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
  const ai = new GoogleGenAI({ apiKey });

  try {
    return await callModel(ai, data, siteText);
  } catch (firstErr) {
    console.warn("Gemini first attempt failed, retrying once:", firstErr);
    return await callModel(ai, data, siteText);
  }
}
