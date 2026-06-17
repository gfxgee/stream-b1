import type { DominantPattern } from "./types";

// Page-of-origin: where the visitor came from before landing on /audit.
// Defaults to "generic" when not supplied.
export type Origin = "generic" | "web_services" | "marketing_services" | "pricing";

export type Cta = {
  key: string;
  label: string;
  sub: string;
};

const CTAS: Record<string, Cta> = {
  book_web_call: {
    key: "book_web_call",
    label: "Book a website strategy call",
    sub: "Walk through the technical findings with us.",
  },
  book_marketing_call: {
    key: "book_marketing_call",
    label: "Book a marketing strategy call",
    sub: "Turn the positioning gaps into a plan.",
  },
  book_growth_call: {
    key: "book_growth_call",
    label: "Book a growth strategy call",
    sub: "Web + marketing, tackled together.",
  },
  quick_fix: {
    key: "quick_fix",
    label: "Get a quick-fix quote",
    sub: "A short, focused engagement to clear the blockers.",
  },
  calculator: {
    key: "calculator",
    label: "Try the project calculator",
    sub: "Scope a larger project and see a price range.",
  },
};

// Detected pattern + page-of-origin determines the primary CTA.
// Origin nudges an otherwise-ambiguous pattern toward the matching service.
export function resolveCta(pattern: DominantPattern, origin: Origin): Cta {
  switch (pattern) {
    case "website":
      return CTAS.book_web_call;
    case "marketing":
      return CTAS.book_marketing_call;
    case "quickfix_only":
      return CTAS.quick_fix;
    case "mixed":
    default:
      // For a mixed verdict, let the page-of-origin break the tie.
      if (origin === "web_services") return CTAS.book_web_call;
      if (origin === "marketing_services") return CTAS.book_marketing_call;
      if (origin === "pricing") return CTAS.calculator;
      return CTAS.book_growth_call;
  }
}

export function normalizeOrigin(value: unknown): Origin {
  const allowed: Origin[] = [
    "generic",
    "web_services",
    "marketing_services",
    "pricing",
  ];
  return allowed.includes(value as Origin) ? (value as Origin) : "generic";
}
