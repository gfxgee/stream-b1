// Fires the Maia pre-call brief to Zapier via a "Catch Hook" trigger.
//
// Zapier setup (for Romeo):
//   1. Create a new Zap
//   2. Trigger:  Webhooks by Zapier → Catch Hook  (copy the webhook URL into ZAPIER_MAIA_WEBHOOK_URL)
//   3. Step 2:  Delay by Zapier → Delay For → 1 Hour
//   4. Step 3:  Email / Slack / etc. → send `maia_brief` field to Maia
//              Subject suggestion: "Stage 1 brief — {{company}} ({{chosen_path}})"
//              Body: use the `maia_brief` field directly — it's pre-formatted plain text
//
// The payload fields this module sends:
//   lead_id      — Supabase plans.lead_id (for traceability)
//   company      — prospect company name
//   chosen_path  — email_plan | book_maia | dig_deeper
//   maia_brief   — the full formatted briefing note (plain text)
//   triggered_at — ISO timestamp of when the plan was generated

export type MaiaZapPayload = {
  leadId: string;
  company: string;
  chosenPath: string;
  maiaBrief: string;
};

// Returns true if the env var is set. Romeo must add this to Vercel environment
// variables once the Zap is created and the webhook URL is known.
export function isZapierConfigured(): boolean {
  return !!process.env.ZAPIER_MAIA_WEBHOOK_URL;
}

// Fires the webhook. Throws on non-2xx so the caller can catch and log.
// This should always be called fire-and-forget (with .catch()) — it must
// never block the customer response.
export async function triggerMaiaZap(payload: MaiaZapPayload): Promise<void> {
  const webhookUrl = process.env.ZAPIER_MAIA_WEBHOOK_URL;

  if (!webhookUrl) {
    // Silently skip during local dev / testing phase before Romeo wires the Zap.
    console.warn(
      "ZAPIER_MAIA_WEBHOOK_URL is not set — skipping Maia brief trigger."
    );
    return;
  }

  const body = JSON.stringify({
    lead_id: payload.leadId,
    company: payload.company,
    chosen_path: payload.chosenPath,
    maia_brief: payload.maiaBrief,
    triggered_at: new Date().toISOString(),
  });

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!response.ok) {
    throw new Error(
      `Zapier webhook returned ${response.status}: ${await response.text()}`
    );
  }
}
