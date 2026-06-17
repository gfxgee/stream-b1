// Audit pipeline (digitalfeet.com/audit) — shared types and options.

export type AuditFormData = {
  url: string;
  email: string;
  company: string;
  employees: string;
  industry: string;
  language: string;
  linkedin: string; // optional — LinkedIn company page
  socials: string; // optional — other social profiles (comma/space separated)
};

export const INITIAL_AUDIT_FORM: AuditFormData = {
  url: "",
  email: "",
  company: "",
  employees: "",
  industry: "",
  language: "",
  linkedin: "",
  socials: "",
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

export type RecCategory =
  | "website"
  | "seo"
  | "content"
  | "social"
  | "linkedin"
  | "leadgen"
  | "branding"
  | "performance"
  | "campaign";

export type Priority = "high" | "medium" | "low";

export type Recommendation = {
  title: string; // the action, e.g. "Add a lead-generation section"
  category: RecCategory;
  reason: string; // why it matters
  fix: string; // how to do it
  priority: Priority;
};

// Five scored dimensions (0–100) for the chart.
export type DimensionScores = {
  website: number;
  seo: number;
  content: number;
  social: number;
  performance: number;
};

// The structured audit the model returns — action-oriented, no pricing.
export type AuditReport = {
  overall_summary: string;
  dimension_scores: DimensionScores;
  recommendations: Recommendation[];
  dominant_pattern: DominantPattern;
};

export const REC_CATEGORY_LABEL: Record<RecCategory, string> = {
  website: "Website",
  seo: "SEO",
  content: "Content",
  social: "Social",
  linkedin: "LinkedIn",
  leadgen: "Lead gen",
  branding: "Branding",
  performance: "Performance",
  campaign: "Campaign",
};

export const DIMENSION_LABEL: Record<keyof DimensionScores, string> = {
  website: "Website",
  seo: "SEO",
  content: "Content",
  social: "Social media",
  performance: "Performance",
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
