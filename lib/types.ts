// Shape of all data collected across the 5-step form.
export type FormData = {
  // Step 1 — Situation
  situation: string;
  // Step 2 — Website URL
  url: string;
  // Step 3 — Scope signals
  budgetBand: string;
  timeline: string;
  projectType: string;
  // Step 4 — About them
  company: string;
  industry: string;
  teamSize: string;
  // Step 5 — Email gate
  email: string;
};

export type ChosenPath =
  | "email_plan"
  | "book_maia"
  | "dig_deeper"
  | "price_only";

export const INITIAL_FORM_DATA: FormData = {
  situation: "",
  url: "",
  budgetBand: "",
  timeline: "",
  projectType: "",
  company: "",
  industry: "",
  teamSize: "",
  email: "",
};

// Select options for the structured "scope signals" + "about them" steps.
export const BUDGET_BANDS = [
  "Not sure yet",
  "Under 50,000 NOK",
  "50,000 – 100,000 NOK",
  "100,000 – 150,000 NOK",
  "150,000+ NOK",
] as const;

export const TIMELINES = [
  "As soon as possible",
  "Within 1–3 months",
  "Within 3–6 months",
  "Flexible / no rush",
] as const;

export const PROJECT_TYPES = [
  "New website",
  "Website redesign",
  "Web app / product",
  "E-commerce",
  "Something else",
] as const;

export const TEAM_SIZES = [
  "Just me",
  "2–10 people",
  "11–50 people",
  "50+ people",
] as const;
