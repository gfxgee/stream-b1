import { NextResponse } from "next/server";
import { generatePlan, isAiConfigured } from "@/lib/gemini";
import { generateMaiaBrief, formatMaiaBrief } from "@/lib/maia-prompt";
import { fetchUrlText } from "@/lib/scrape";
import { persistLeadAndPlan } from "@/lib/persist";
import { validateAll } from "@/lib/validation";
import { INITIAL_FORM_DATA, type ChosenPath, type FormData } from "@/lib/types";
import { triggerMaiaZap } from "@/lib/zapier";

// Plans can take a handful of seconds to generate; give the route headroom.
export const maxDuration = 60;

const VALID_PATHS: ChosenPath[] = [
  "email_plan",
  "book_maia",
  "dig_deeper",
  "price_only",
];

function coerceFormData(input: unknown): FormData {
  const obj = (input ?? {}) as Record<string, unknown>;
  const out = { ...INITIAL_FORM_DATA };
  for (const key of Object.keys(out) as (keyof FormData)[]) {
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

  const { data: rawData, path: rawPath } = (body ?? {}) as {
    data?: unknown;
    path?: unknown;
  };

  const chosenPath = VALID_PATHS.includes(rawPath as ChosenPath)
    ? (rawPath as ChosenPath)
    : null;
  if (!chosenPath) {
    return NextResponse.json(
      { error: "Missing or invalid 'path'." },
      { status: 400 }
    );
  }

  const data = coerceFormData(rawData);

  const errors = validateAll(data, chosenPath);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "Validation failed", errors },
      { status: 422 }
    );
  }

  if (!isAiConfigured()) {
    return NextResponse.json(
      {
        error:
          "AI is not configured yet. Set AI_PROVIDER and the matching API key in your environment variables.",
      },
      { status: 503 }
    );
  }

  // Best-effort site context — never blocks plan generation.
  const siteText = data.url ? await fetchUrlText(data.url) : null;

  let plan;
  try {
    ({ plan } = await generatePlan(data, siteText));
  } catch (err) {
    console.error("Plan generation failed:", err);
    return NextResponse.json(
      { error: "We couldn't generate a plan right now. Please try again." },
      { status: 502 }
    );
  }

  // Generate the Maia brief — only for paths that lead to a Stage 1 call.
  // price_only skips this entirely: no call is booked, no brief is needed.
  // Failures are intentionally non-fatal: the customer gets their plan regardless.
  let maiaBriefText: string | null = null;
  if (chosenPath !== "price_only") {
    const brief = await generateMaiaBrief(data, plan);
    if (brief) {
      maiaBriefText = formatMaiaBrief(brief);
    }
  }

  // Persist lead + plan (+ Maia brief). A storage failure shouldn't deny the
  // user their plan.
  let persisted = false;
  let leadId: string | null = null;
  try {
    ({ persisted, leadId } = await persistLeadAndPlan(data, chosenPath, plan, maiaBriefText));
  } catch (err) {
    console.error("Persistence failed (returning plan anyway):", err);
  }

  // Fire the Zapier webhook — only when a Maia brief was generated (i.e. not
  // price_only) and persistence succeeded (leadId is available).
  // Fire-and-forget: we do NOT await so the customer response is never delayed.
  if (maiaBriefText && leadId) {
    triggerMaiaZap({
      leadId,
      company: data.company,
      chosenPath,
      maiaBrief: maiaBriefText,
    }).catch((err) =>
      console.error("Zapier webhook failed (non-fatal):", err)
    );
  }

  return NextResponse.json({ plan, persisted, leadId });
}
