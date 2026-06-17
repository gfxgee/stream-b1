import { NextResponse } from "next/server";
import { generateAudit, isGeminiConfigured } from "@/lib/audit/gemini";
import { runScan } from "@/lib/audit/scan";
import { normalizeOrigin, resolveCta } from "@/lib/audit/cta";
import { persistAudit } from "@/lib/audit/persist";
import { qualifierReason, validateAuditForm } from "@/lib/audit/validation";
import { INITIAL_AUDIT_FORM, type AuditFormData } from "@/lib/audit/types";

// Scanning + generation can take a while (PageSpeed alone is ~10–25s).
export const maxDuration = 60;

function coerce(input: unknown): AuditFormData {
  const obj = (input ?? {}) as Record<string, unknown>;
  const out = { ...INITIAL_AUDIT_FORM };
  for (const key of Object.keys(out) as (keyof AuditFormData)[]) {
    const v = obj[key];
    if (typeof v === "string") out[key] = v.trim();
  }
  return out;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { data: rawData, origin: rawOrigin } = (body ?? {}) as {
    data?: unknown;
    origin?: unknown;
  };
  const data = coerce(rawData);
  const origin = normalizeOrigin(rawOrigin);

  const errors = validateAuditForm(data);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "Validation failed", errors },
      { status: 422 }
    );
  }

  // Silent qualifier filter — non-qualifiers get a polite rejection, no scan/AI.
  const reason = qualifierReason(data);
  if (reason) {
    await persistAudit({ data, origin, qualified: false, rejectionReason: reason });
    return NextResponse.json({ qualified: false, reason });
  }

  if (!isGeminiConfigured) {
    return NextResponse.json(
      {
        error:
          "AI is not configured yet. Add GEMINI_API_KEY to .env.local to run audits.",
      },
      { status: 503 }
    );
  }

  const scan = await runScan(data.url);

  let report;
  try {
    report = await generateAudit(data, scan);
  } catch (err) {
    console.error("Audit generation failed:", err);
    return NextResponse.json(
      { error: "We couldn't generate your audit right now. Please try again." },
      { status: 502 }
    );
  }

  const cta = resolveCta(report.dominant_pattern, origin);

  let persisted = false;
  try {
    persisted = await persistAudit({
      data,
      origin,
      qualified: true,
      scan,
      report,
      cta,
    });
  } catch (err) {
    console.error("Audit persistence failed (returning report anyway):", err);
  }

  return NextResponse.json({
    qualified: true,
    report,
    cta,
    scan: {
      reachable: scan.reachable,
      pageSpeed: scan.pageSpeed,
      seo: scan.seo,
      links: scan.links,
      tech: scan.tech,
    },
    persisted,
  });
}
