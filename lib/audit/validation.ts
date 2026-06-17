import {
  EMPLOYEE_BANDS,
  INDUSTRIES,
  type AuditFormData,
} from "./types";

export type AuditErrors = Partial<Record<keyof AuditFormData, string>>;

function isValidUrl(value: string): boolean {
  try {
    const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const u = new URL(candidate);
    return !!u.hostname && u.hostname.includes(".");
  } catch {
    return false;
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validateAuditForm(data: AuditFormData): AuditErrors {
  const errors: AuditErrors = {};
  if (!data.url.trim() || !isValidUrl(data.url.trim()))
    errors.url = "Please enter a valid website URL.";
  if (!isValidEmail(data.email)) errors.email = "Please enter a valid email.";
  if (!data.company.trim()) errors.company = "Please enter your company name.";
  if (!data.employees) errors.employees = "Please pick a team size.";
  if (!data.industry) errors.industry = "Please pick an industry.";
  if (!data.language) errors.language = "Please pick a language.";
  // LinkedIn is optional, but must look like a URL if provided.
  if (data.linkedin.trim() && !isValidUrl(data.linkedin.trim()))
    errors.linkedin = "That doesn't look like a valid URL.";
  return errors;
}

// The silent qualifier: 4+ employees AND an IT-related industry.
// Returns null when qualified, or a short reason when not.
export function qualifierReason(data: AuditFormData): string | null {
  const band = EMPLOYEE_BANDS.find((b) => b.value === data.employees);
  const industry = INDUSTRIES.find((i) => i.value === data.industry);
  if (!band?.qualifies) return "team_too_small";
  if (!industry?.it) return "industry_not_it";
  return null;
}
