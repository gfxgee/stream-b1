import { NextResponse } from "next/server";
import { triggerMaiaZap } from "@/lib/zapier";

// Only accessible in non-production environments.
// Fires a fake Maia brief payload to Zapier so Romeo can map fields without
// needing to submit the full Calculator form.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test payload endpoint is disabled in production." },
      { status: 403 }
    );
  }

  const webhookUrl = process.env.ZAPIER_MAIA_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      {
        error:
          "ZAPIER_MAIA_WEBHOOK_URL is not set. Add it to your Vercel environment variables first.",
      },
      { status: 503 }
    );
  }

  const testBrief = [
    "── MAIA BRIEF ── Stage 1 prep ──────────────────────────────",
    "",
    "SITUATION",
    "Acme Studio is a 12-person design agency that wants to migrate their existing WordPress site to a headless setup and start selling online courses. They've tried this once before and stalled at the CMS integration stage.",
    "",
    "RECOMMENDED APPROACH",
    "Lead with the phased migration option — Quick Launch first to get them live, Custom Build in Stage 2 once trust is established. Don't open with the full Custom Build price.",
    "",
    "⚠ BUDGET FLAG",
    "Stated budget band is 40–60k NOK but the generated plan came in at 80–110k NOK. Expect pushback — have the phased option ready.",
    "",
    "KEY RISKS",
    "• Previous failed migration attempt — probe what went wrong before committing to a timeline",
    "• Course platform choice is undecided — this will affect scope significantly",
    "• Small team, likely no dedicated dev — ongoing maintenance ownership is unclear",
    "",
    "QUESTIONS TO ASK",
    "• What stopped the last migration attempt — technical, budget, or internal bandwidth?",
    "• Which course platform are you leaning toward, or is that still open?",
    "• Who owns the site after we hand it over — internal person or back to us?",
    "• Is the 40–60k band fixed or is there flexibility if we phase the work?",
    "• What does success look like 6 months after launch?",
    "",
    "────────────────────────────────────────────────────────────",
  ].join("\n");

  try {
    await triggerMaiaZap({
      leadId: "test-lead-000",
      company: "Acme Studio",
      chosenPath: "book_maia",
      maiaBrief: testBrief,
    });

    return NextResponse.json({
      ok: true,
      message: "Test payload sent to Zapier successfully.",
      webhookUrl: webhookUrl.replace(
        /\/hooks\/catch\/(\d+)\/.+/,
        "/hooks/catch/$1/***"
      ),
      payload: {
        lead_id: "test-lead-000",
        company: "Acme Studio",
        chosen_path: "book_maia",
        maia_brief: testBrief,
        triggered_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Zapier webhook call failed: ${message}` },
      { status: 502 }
    );
  }
}
