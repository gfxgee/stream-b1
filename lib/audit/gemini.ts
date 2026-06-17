import { GoogleGenAI, Type } from "@google/genai";
import type { AuditFormData, AuditReport, ScanResult } from "./types";

const MODEL = "gemini-2.5-flash";

export const isGeminiConfigured = Boolean(process.env.GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `You are the diagnostic engine for Digitalfeet's website + marketing Audit. A prospect submitted their site for a free, single-tier audit. There is NO manual review — your output ships as-is, so be accurate, specific, and useful.

You are given (a) the prospect's details and (b) machine scan signals: PageSpeed Insights scores, on-page SEO facts, a broken-link sample, and detected tech. Ground every WEB finding in those signals — cite concrete numbers (scores, counts). Do not invent metrics you weren't given.

For MARKETING posture, you only have the site's own text and tech (no LinkedIn/Semrush/competitor data in this version). Infer cautiously from what's present and SAY when a read is limited or speculative — never fabricate competitor names, follower counts, or campaigns.

Classify the dominant_pattern:
- "website": problems are mostly technical/site quality (performance, SEO, broken links, UX).
- "marketing": the site is technically fine but positioning/audience/marketing footprint is weak.
- "mixed": meaningful problems on both sides.
- "quickfix_only": basically healthy; only small, isolated fixes needed.

Keep findings concrete and prioritized. Return ONLY JSON matching the schema.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overall_summary: { type: Type.STRING },
    web: {
      type: Type.OBJECT,
      properties: {
        findings: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              detail: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ["high", "medium", "low"] },
            },
            required: ["title", "detail", "severity"],
          },
        },
      },
      required: ["findings"],
    },
    marketing: {
      type: Type.OBJECT,
      properties: {
        audience_read: { type: Type.STRING },
        positioning_gap: { type: Type.STRING },
        marketing_footprint: { type: Type.STRING },
        competitor_stance: { type: Type.STRING },
      },
      required: [
        "audience_read",
        "positioning_gap",
        "marketing_footprint",
        "competitor_stance",
      ],
    },
    dominant_pattern: {
      type: Type.STRING,
      enum: ["website", "marketing", "mixed", "quickfix_only"],
    },
    top_recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    rationale: { type: Type.STRING },
  },
  required: [
    "overall_summary",
    "web",
    "marketing",
    "dominant_pattern",
    "top_recommendations",
    "rationale",
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
    typeof r.web === "object" &&
    Array.isArray((r.web as { findings?: unknown }).findings) &&
    typeof r.marketing === "object" &&
    patterns.includes(r.dominant_pattern as string) &&
    Array.isArray(r.top_recommendations) &&
    typeof r.rationale === "string"
  );
}

async function callModel(
  ai: GoogleGenAI,
  data: AuditFormData,
  scan: ScanResult
): Promise<AuditReport> {
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: buildPrompt(data, scan),
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.5,
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: 2048,
    },
  });
  const text = res.text;
  if (!text) throw new Error("Empty response from model.");
  const parsed = JSON.parse(text) as unknown;
  if (!isValidReport(parsed))
    throw new Error("Model returned JSON that did not match the audit schema.");
  return parsed;
}

// Generates the audit, retrying once on malformed output.
export async function generateAudit(
  data: AuditFormData,
  scan: ScanResult
): Promise<AuditReport> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
  const ai = new GoogleGenAI({ apiKey });
  try {
    return await callModel(ai, data, scan);
  } catch (firstErr) {
    console.warn("Audit first attempt failed, retrying once:", firstErr);
    return await callModel(ai, data, scan);
  }
}
