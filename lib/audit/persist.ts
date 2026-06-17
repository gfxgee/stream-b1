import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Cta, Origin } from "./cta";
import type { AuditFormData, AuditReport, ScanResult } from "./types";

type PersistArgs = {
  data: AuditFormData;
  origin: Origin;
  qualified: boolean;
  rejectionReason?: string | null;
  scan?: ScanResult | null;
  report?: AuditReport | null;
  cta?: Cta | null;
};

// Inserts one audit row (qualifiers and non-qualifiers alike). Degrades to
// persisted:false when Supabase isn't configured.
export async function persistAudit(args: PersistArgs): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const supabase = getSupabase()!;
  const { data, origin, qualified, rejectionReason, scan, report, cta } = args;

  const { error } = await supabase.from("audits").insert({
    url: scan?.fetchedUrl || data.url,
    email: data.email || null,
    company: data.company || null,
    employees: data.employees || null,
    industry: data.industry || null,
    language: data.language || null,
    linkedin: data.linkedin || null,
    socials: data.socials || null,
    origin,
    qualified,
    rejection_reason: rejectionReason ?? null,
    dominant_pattern: report?.dominant_pattern ?? null,
    primary_cta: cta?.key ?? null,
    performance_score: scan?.pageSpeed?.performance ?? null,
    report_json: report ?? null,
    scan_json: scan ?? null,
  });

  if (error) {
    console.error("Supabase audit insert failed:", error.message);
    return false;
  }
  return true;
}
