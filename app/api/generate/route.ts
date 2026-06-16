import { NextResponse } from "next/server";
import { generatePlan, isGeminiConfigured } from "@/lib/gemini";
import { fetchUrlText } from "@/lib/scrape";
import { persistLeadAndPlan } from "@/lib/persist";
import { validateAll } from "@/lib/validation";
import { INITIAL_FORM_DATA, type ChosenPath, type FormData } from "@/lib/types";

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

  const path = VALID_PATHS.includes(rawPath as ChosenPath)
    ? (rawPath as ChosenPath)
    : null;
  if (!path) {
    return NextResponse.json(
      { error: "Missing or invalid 'path'." },
      { status: 400 }
    );
  }

  const data = coerceFormData(rawData);

  const errors = validateAll(data, path);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "Validation failed", errors },
      { status: 422 }
    );
  }

  if (!isGeminiConfigured) {
    return NextResponse.json(
      {
        error:
          "AI is not configured yet. Add GEMINI_API_KEY to .env.local to generate plans.",
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

  // Persist lead + plan. A storage failure shouldn't deny the user their plan.
  let persisted = false;
  let leadId: string | null = null;
  try {
    ({ persisted, leadId } = await persistLeadAndPlan(data, path, plan));
  } catch (err) {
    console.error("Persistence failed (returning plan anyway):", err);
  }

  return NextResponse.json({ plan, persisted, leadId });
}
