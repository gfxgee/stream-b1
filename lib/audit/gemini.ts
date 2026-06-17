import type { AuditFormData, AuditReport, ScanResult } from "./types";
import { generateJSON, isAiConfigured } from "@/lib/ai";

// Re-export so existing imports keep working; now provider-aware.
export { isAiConfigured };

const SYSTEM_INSTRUCTION = `You are the diagnostic engine for Digitalfeet's free Website Audit. A prospect submitted their site. There is NO manual review — your output ships as-is, so be accurate, specific, and actionable.

This is an AUDIT, not a project plan or quote. NEVER mention price, cost, budget, hours, or estimates — pricing lives in a separate tool. Your job is insight + concrete recommended actions.

Cover these areas: website (speed, meta, structure, UX), SEO, content, social media, and LinkedIn, plus lead generation and branding where relevant.

INPUTS you get: prospect details, and machine scan signals (PageSpeed Insights scores, on-page SEO facts, a broken-link sample, detected tech). Ground WEB/SEO/performance points in those signals — cite concrete numbers. For LinkedIn/social you only have the URLs the prospect supplied (no live scraping in this version); infer cautiously from those and the site, and SAY when a read is limited. Never fabricate follower counts, competitor names, or campaigns.

Produce TWO things:
1. dimension_scores: score each of website, seo, content, social, performance from 0–100 (higher = healthier), informed by the signals. Use the PageSpeed performance score directly for "performance" when available.
2. recommendations: 5–8 concrete actions. EACH must have: a short action title (e.g. "Add a lead-generation section"), a category, a one-sentence reason (why it matters), a one-sentence fix (what to do), and a priority. Order the most important first. Mirror the style of: "Rebrand homepage", "Restructure website", "Fix meta tags", "Fix social media", "Slow site speed", "Make a knowledge page", "Run a campaign".

Also classify dominant_pattern:
- "website": problems mostly technical/site quality.
- "marketing": site is fine but positioning/social/content is weak.
- "mixed": meaningful problems on both sides.
- "quickfix_only": basically healthy; only small isolated fixes.

Write everything in the requested report language. Return ONLY JSON matching the schema.`;

// Provider-neutral JSON Schema (works for both Gemini and OpenAI strict mode).
const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    overall_summary: { type: "string" },
    dimension_scores: {
      type: "object",
      additionalProperties: false,
      properties: {
        website: { type: "integer" },
        seo: { type: "integer" },
        content: { type: "integer" },
        social: { type: "integer" },
        performance: { type: "integer" },
      },
      required: ["website", "seo", "content", "social", "performance"],
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          category: {
            type: "string",
            enum: [
              "website",
              "seo",
              "content",
              "social",
              "linkedin",
              "leadgen",
              "branding",
              "performance",
              "campaign",
            ],
          },
          reason: { type: "string" },
          fix: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["title", "category", "reason", "fix", "priority"],
      },
    },
    dominant_pattern: {
      type: "string",
      enum: ["website", "marketing", "mixed", "quickfix_only"],
    },
  },
  required: [
    "overall_summary",
    "dimension_scores",
    "recommendations",
    "dominant_pattern",
  ],
};

function buildPrompt(data: AuditFormData, scan: ScanResult): string {
  return [
    "PROSPECT",
    `Company: ${data.company}`,
    `Industry: ${data.industry}`,
    `Team size: ${data.employees}`,
    `Report language: ${data.language}`,
    `URL: ${scan.fetchedUrl} (reachable: ${scan.reachable})`,
    `LinkedIn: ${data.linkedin || "(not provided)"}`,
    `Other socials: ${data.socials || "(not provided)"}`,
    "",
    "SCAN SIGNALS (JSON):",
    JSON.stringify(
      { seo: scan.seo, links: scan.links, tech: scan.tech, pageSpeed: scan.pageSpeed },
      null,
      2
    ),
    "",
    scan.textExcerpt
      ? `HOMEPAGE TEXT EXCERPT (truncated):\n"""${scan.textExcerpt}"""`
      : "HOMEPAGE TEXT: (unavailable)",
    "",
    `Write the audit in ${data.language}. Tailor it to a ${data.industry} company.`,
  ].join("\n");
}

function isValidReport(v: unknown): v is AuditReport {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  const patterns = ["website", "marketing", "mixed", "quickfix_only"];
  return (
    typeof r.overall_summary === "string" &&
    typeof r.dimension_scores === "object" &&
    r.dimension_scores !== null &&
    Array.isArray(r.recommendations) &&
    patterns.includes(r.dominant_pattern as string)
  );
}

async function callModel(
  data: AuditFormData,
  scan: ScanResult
): Promise<AuditReport> {
  const parsed = await generateJSON({
    system: SYSTEM_INSTRUCTION,
    user: buildPrompt(data, scan),
    schema: RESPONSE_SCHEMA,
    schemaName: "website_audit",
    temperature: 0.5,
    maxOutputTokens: 2048,
  });
  if (!isValidReport(parsed))
    throw new Error("Model returned JSON that did not match the audit schema.");
  return parsed;
}

// Generates the audit, retrying once on malformed output.
export async function generateAudit(
  data: AuditFormData,
  scan: ScanResult
): Promise<AuditReport> {
  if (!isAiConfigured()) throw new Error("AI provider is not configured.");
  try {
    return await callModel(data, scan);
  } catch (firstErr) {
    console.warn("Audit: first attempt failed, retrying once:", firstErr);
    return await callModel(data, scan);
  }
}
