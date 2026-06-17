// Audit pipeline (digitalfeet.com/audit) — shared types and options.

export type AuditFormData = {
  url: string;
  email: string;
  company: string;
  employees: string;
  industry: string;
  language: string;
};

export const INITIAL_AUDIT_FORM: AuditFormData = {
  url: "",
  email: "",
  company: "",
  employees: "",
  industry: "",
  language: "",
};

// Employee bands. `qualifies` encodes the "4+ employees" half of the filter.
export const EMPLOYEE_BANDS = [
  { value: "1 (just me)", qualifies: false },
  { value: "2–3", qualifies: false },
  { value: "4–10", qualifies: true },
  { value: "11–50", qualifies: true },
  { value: "51–200", qualifies: true },
  { value: "200+", qualifies: true },
] as const;

// Industries. `it` encodes the "IT-related industry" half of the filter.
export const INDUSTRIES = [
  { value: "Software / SaaS", it: true },
  { value: "IT services / consulting", it: true },
  { value: "E-commerce / online retail", it: true },
  { value: "Digital agency / marketing", it: true },
  { value: "Fintech", it: true },
  { value: "Tech-enabled services", it: true },
  { value: "Manufacturing", it: false },
  { value: "Hospitality / restaurant", it: false },
  { value: "Physical retail", it: false },
  { value: "Construction", it: false },
  { value: "Healthcare", it: false },
  { value: "Other", it: false },
] as const;

export const LANGUAGES = ["English", "Norwegian"] as const;

export type DominantPattern =
  | "website"
  | "marketing"
  | "mixed"
  | "quickfix_only";

// The structured audit the model returns.
export type AuditReport = {
  overall_summary: string;
  web: {
    findings: { title: string; detail: string; severity: "high" | "medium" | "low" }[];
  };
  marketing: {
    audience_read: string;
    positioning_gap: string;
    marketing_footprint: string;
    competitor_stance: string;
  };
  dominant_pattern: DominantPattern;
  top_recommendations: string[];
  rationale: string;
};

// Raw scanner output passed to the model and stored for debugging.
export type ScanResult = {
  fetchedUrl: string;
  reachable: boolean;
  seo: {
    title: string | null;
    titleLength: number;
    metaDescription: string | null;
    metaDescriptionLength: number;
    h1Count: number;
    h1Text: string[];
    wordCount: number;
    imagesTotal: number;
    imagesMissingAlt: number;
    hasViewport: boolean;
    hasCanonical: boolean;
    lang: string | null;
  } | null;
  links: {
    internal: number;
    external: number;
    checkedSample: number;
    broken: { url: string; status: number | string }[];
  } | null;
  tech: string[];
  pageSpeed: {
    available: boolean;
    performance: number | null;
    seo: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    metrics: Record<string, string>;
  };
  textExcerpt: string | null;
};
