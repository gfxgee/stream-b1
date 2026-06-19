// Generates the internal Maia briefing note for a Stage 1 call.
// Stored in plans.maia_prompt at plan-creation time.
// Make.com fires it to Maia 1 hour before the Stage 1 call.
//
// This is NOT shown to the prospect — it is for Maia's eyes only.

import type { FormData } from "./types";
import type { GeneratedPlan } from "./gemini";
import { generateJSON, isAiConfigured } from "./ai";

export { isAiConfigured };

// The briefing note the model returns.
export type MaiaBrief = {
  situation_summary: string;       // 2–3 sentence plain-language read of what the lead actually wants
  recommended_approach: string;    // How Maia should frame the call: what to lead with, what to offer
  key_risks: string[];             // 1–4 short risks Maia should be aware of going in
  suggested_questions: string[];   // 3–5 questions to ask on the call
  budget_flag: string | null;      // Non-null when stated budget doesn't match the plan price — plain sentence
};

const SYSTEM_INSTRUCTION = `You are writing an internal pre-call briefing note for Maia, a senior strategist at Digitalfeet. She will read this 1 hour before a Stage 1 discovery call with the prospect. Be direct and operational — no fluff, no pleasantries. Maia is experienced; she doesn't need padding.

NEVER address the prospect directly. This is internal. Do not use "you" to mean the prospect.

Structure:
1. situation_summary: 2–3 sentences. What does this lead actually want, in plain language? Strip the noise from their submission.
2. recommended_approach: 1–2 sentences. How should Maia frame this call — what to lead with, what angle to take, what to offer.
3. key_risks: 1–4 short bullet risks. Things that could derail the deal or the project. Be honest.
4. suggested_questions: 3–5 concrete questions for Maia to ask on the call. Make them specific to THIS lead, not generic.
5. budget_flag: ONLY populate this when the prospect's stated budget band does not match the price range in the generated plan. Write one plain sentence explaining the gap. Set to null if the budget is roughly aligned.

Return ONLY JSON matching the provided schema. Write everything in English.`;

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    situation_summary: { type: "string" },
    recommended_approach: { type: "string" },
    key_risks: {
      type: "array",
      items: { type: "string" },
    },
    suggested_questions: {
      type: "array",
      items: { type: "string" },
    },
    budget_flag: { type: ["string", "null"] },
  },
  required: [
    "situation_summary",
    "recommended_approach",
    "key_risks",
    "suggested_questions",
    "budget_flag",
  ],
};

function buildPrompt(data: FormData, plan: GeneratedPlan): string {
  return [
    "PROSPECT SUBMISSION",
    `Company: ${data.company}`,
    `Industry: ${data.industry}`,
    `Team size: ${data.teamSize}`,
    `Project type: ${data.projectType}`,
    `Stated budget band: ${data.budgetBand}`,
    `Timeline: ${data.timeline}`,
    `Website: ${data.url || "(none provided)"}`,
    "",
    "Their situation in their own words:",
    `"${data.situation}"`,
    "",
    "GENERATED PLAN (customer-facing)",
    `Price range: ${plan.price_min.toLocaleString()} – ${plan.price_max.toLocaleString()} ${plan.currency}`,
    `Recommended path: ${plan.recommended_path}`,
    `Rationale: ${plan.rationale}`,
    "",
    plan.plan_markdown,
  ].join("\n");
}

function isValidBrief(value: unknown): value is MaiaBrief {
  if (!value || typeof value !== "object") return false;
  const b = value as Record<string, unknown>;
  return (
    typeof b.situation_summary === "string" &&
    typeof b.recommended_approach === "string" &&
    Array.isArray(b.key_risks) &&
    Array.isArray(b.suggested_questions) &&
    (b.budget_flag === null || typeof b.budget_flag === "string")
  );
}

async function callModel(data: FormData, plan: GeneratedPlan): Promise<MaiaBrief> {
  const parsed = await generateJSON({
    system: SYSTEM_INSTRUCTION,
    user: buildPrompt(data, plan),
    schema: RESPONSE_SCHEMA,
    schemaName: "maia_brief",
    temperature: 0.4,       // Lower temp: briefings should be consistent and factual
    maxOutputTokens: 1024,
  });
  if (!isValidBrief(parsed)) {
    throw new Error("Model returned JSON that did not match the MaiaBrief schema.");
  }
  return parsed;
}

// Generates the Maia briefing note. Retries once on failure.
// Returns null (never throws) — a missing brief must never block the customer
// from receiving their plan.
export async function generateMaiaBrief(
  data: FormData,
  plan: GeneratedPlan
): Promise<MaiaBrief | null> {
  if (!isAiConfigured()) return null;
  try {
    return await callModel(data, plan);
  } catch (firstErr) {
    console.warn("Maia brief: first attempt failed, retrying once:", firstErr);
    try {
      return await callModel(data, plan);
    } catch (secondErr) {
      console.error("Maia brief: both attempts failed — storing null:", secondErr);
      return null;
    }
  }
}

// Serialises a MaiaBrief into the plain-text string stored in plans.maia_prompt.
// Romeo's Make.com scenario reads this column and sends it to Maia as-is.
export function formatMaiaBrief(brief: MaiaBrief): string {
  const lines: string[] = [];

  lines.push("── MAIA BRIEF ── Stage 1 prep ──────────────────────────────");
  lines.push("");

  lines.push("SITUATION");
  lines.push(brief.situation_summary);
  lines.push("");

  lines.push("RECOMMENDED APPROACH");
  lines.push(brief.recommended_approach);
  lines.push("");

  if (brief.budget_flag) {
    lines.push("⚠ BUDGET FLAG");
    lines.push(brief.budget_flag);
    lines.push("");
  }

  lines.push("KEY RISKS");
  for (const risk of brief.key_risks) {
    lines.push(`• ${risk}`);
  }
  lines.push("");

  lines.push("QUESTIONS TO ASK");
  for (const q of brief.suggested_questions) {
    lines.push(`• ${q}`);
  }

  lines.push("");
  lines.push("────────────────────────────────────────────────────────────");

  return lines.join("\n");
}
