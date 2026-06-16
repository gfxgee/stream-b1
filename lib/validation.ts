import type { ChosenPath, FormData } from "./types";

// Per-field error messages, keyed by FormData field.
export type Errors = Partial<Record<keyof FormData, string>>;

const SITUATION_MIN = 15;

function isValidUrl(value: string): boolean {
  try {
    // Accept bare domains by prepending a scheme when missing.
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

// Validates only the fields belonging to the given step (1-indexed).
// Returns an empty object when the step is valid.
export function validateStep(step: number, data: FormData): Errors {
  const errors: Errors = {};

  switch (step) {
    case 1:
      if (data.situation.trim().length < SITUATION_MIN) {
        errors.situation = `Please add a little more detail (at least ${SITUATION_MIN} characters).`;
      }
      break;
    case 2:
      // URL is optional, but if provided it must look like a real URL.
      if (data.url.trim() && !isValidUrl(data.url.trim())) {
        errors.url = "That doesn't look like a valid URL.";
      }
      break;
    case 3:
      if (!data.budgetBand) errors.budgetBand = "Please pick a budget band.";
      if (!data.timeline) errors.timeline = "Please pick a timeline.";
      if (!data.projectType)
        errors.projectType = "Please pick a project type.";
      break;
    case 4:
      if (!data.company.trim())
        errors.company = "Please enter a company or project name.";
      if (!data.industry.trim()) errors.industry = "Please enter an industry.";
      if (!data.teamSize) errors.teamSize = "Please pick a team size.";
      break;
    case 5:
      if (!isValidEmail(data.email)) {
        errors.email = "Please enter a valid email address.";
      }
      break;
  }

  return errors;
}

// Validates the entire payload (used server-side). Steps 1–4 always apply;
// the email gate (step 5) is enforced for every path except the price-only exit.
export function validateAll(data: FormData, path: ChosenPath): Errors {
  let errors: Errors = {};
  for (const step of [1, 2, 3, 4]) {
    errors = { ...errors, ...validateStep(step, data) };
  }
  if (path !== "price_only") {
    errors = { ...errors, ...validateStep(5, data) };
  }
  return errors;
}
