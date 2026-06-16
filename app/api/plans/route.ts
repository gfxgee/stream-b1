import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

// Lists generated plans (with their lead context) and updates quality scores.
// POC review tooling — test data only, no auth (see spec §6, §9).

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Supabase isn't configured." },
      { status: 503 }
    );
  }
  const supabase = getSupabase()!;
  const { data, error } = await supabase
    .from("plans")
    .select(
      "id, created_at, price_min, price_max, currency, plan_markdown, quality_score, " +
        "lead:leads(situation, company, industry, budget_band, project_type, timeline, chosen_path, email, url)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase plans select failed:", error.message);
    return NextResponse.json({ error: "Could not load plans." }, { status: 500 });
  }
  return NextResponse.json({ plans: data ?? [] });
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Supabase isn't configured." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { id, quality_score } = (body ?? {}) as {
    id?: unknown;
    quality_score?: unknown;
  };

  if (typeof id !== "string") {
    return NextResponse.json({ error: "Missing plan id." }, { status: 400 });
  }
  // Allow 1–5, or null to clear the score.
  const score =
    quality_score === null
      ? null
      : typeof quality_score === "number" &&
          Number.isInteger(quality_score) &&
          quality_score >= 1 &&
          quality_score <= 5
        ? quality_score
        : undefined;
  if (score === undefined) {
    return NextResponse.json(
      { error: "quality_score must be an integer 1–5, or null." },
      { status: 400 }
    );
  }

  const supabase = getSupabase()!;
  const { error } = await supabase
    .from("plans")
    .update({ quality_score: score })
    .eq("id", id);

  if (error) {
    console.error("Supabase quality_score update failed:", error.message);
    return NextResponse.json({ error: "Could not save score." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
