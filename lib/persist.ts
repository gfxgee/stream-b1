import { getSupabase, isSupabaseConfigured } from "./supabase";
import type { GeneratedPlan } from "./gemini";
import type { ChosenPath, FormData } from "./types";

export type PersistResult = { leadId: string | null; persisted: boolean };

// Inserts the lead and (if present) its generated plan. Degrades gracefully to
// { persisted: false } when Supabase isn't configured, so the POC still runs.
export async function persistLeadAndPlan(
  data: FormData,
  path: ChosenPath,
  plan: GeneratedPlan | null,
  // Formatted Maia briefing note — null for price_only leads (no call is booked)
  // or when generation failed. Stored in plans.maia_prompt for Romeo to trigger.
  maiaBrief: string | null = null
): Promise<PersistResult> {
  if (!isSupabaseConfigured) return { leadId: null, persisted: false };
  const supabase = getSupabase()!;

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      situation: data.situation,
      url: data.url || null,
      budget_band: data.budgetBand,
      timeline: data.timeline,
      project_type: data.projectType,
      company: data.company,
      industry: data.industry,
      team_size: data.teamSize,
      email: path === "price_only" ? null : data.email || null,
      chosen_path: path,
    })
    .select("id")
    .single();

  if (leadError) {
    console.error("Supabase lead insert failed:", leadError.message);
    throw new Error("lead_insert_failed");
  }

  if (plan) {
    const { error: planError } = await supabase.from("plans").insert({
      lead_id: lead.id,
      price_min: plan.price_min,
      price_max: plan.price_max,
      currency: plan.currency,
      plan_markdown: plan.plan_markdown,
      raw_json: plan,
      // Stored as plain text so Make.com can read and forward it directly.
      // Null for price_only leads — no Stage 1 call is booked.
      maia_prompt: maiaBrief ?? null,
    });
    if (planError) {
      // Lead is already saved; a missing plan row shouldn't fail the request.
      console.error("Supabase plan insert failed:", planError.message);
    }
  }

  return { leadId: lead.id, persisted: true };
}
