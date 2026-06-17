"use client";

import { motion, type Variants } from "framer-motion";
import type { Cta } from "@/lib/audit/cta";
import type { AuditReport, DominantPattern, ScanResult } from "@/lib/audit/types";

type ScanSummary = Pick<ScanResult, "reachable" | "pageSpeed" | "seo" | "links" | "tech">;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const PATTERN_LABEL: Record<DominantPattern, string> = {
  website: "Website-led",
  marketing: "Marketing-led",
  mixed: "Mixed (web + marketing)",
  quickfix_only: "Quick fixes only",
};

const SEVERITY: Record<string, string> = {
  high: "border-red-300 bg-red-50 text-red-700",
  medium: "border-orange/40 bg-orange/10 text-orange-deep",
  low: "border-ink/15 bg-cream text-ink",
};

function scoreColor(score: number | null): string {
  if (score == null) return "text-graybrand";
  if (score >= 90) return "text-emerald-600";
  if (score >= 50) return "text-orange-deep";
  return "text-red-600";
}

function ScoreChip({ label, score }: { label: string; score: number | null }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-3 text-center">
      <p className={`font-heading text-h3-m font-bold ${scoreColor(score)}`}>
        {score == null ? "—" : score}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-graybrand">{label}</p>
    </div>
  );
}

export default function AuditReportView({
  report,
  cta,
  scan,
  company,
  persisted,
  onReset,
}: {
  report: AuditReport;
  cta: Cta;
  scan: ScanSummary | null;
  company: string;
  persisted: boolean;
  onReset: () => void;
}) {
  const psi = scan?.pageSpeed;
  const marketing = report.marketing;

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm sm:p-7"
    >
      <motion.div variants={item} className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-heading text-sm font-medium tracking-wide text-orange-deep">
            Audit report · {company}
          </p>
          <h2 className="mt-1 font-heading text-h3-m font-bold text-ink sm:text-h3">
            Your diagnostic
          </h2>
        </div>
        <span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-semibold text-blue">
          {PATTERN_LABEL[report.dominant_pattern]}
        </span>
      </motion.div>

      <motion.p variants={item} className="mt-3 text-sm leading-relaxed text-ink/90">
        {report.overall_summary}
      </motion.p>

      {/* PageSpeed scores */}
      {psi?.available ? (
        <motion.div variants={item} className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ScoreChip label="Performance" score={psi.performance} />
          <ScoreChip label="SEO" score={psi.seo} />
          <ScoreChip label="Accessibility" score={psi.accessibility} />
          <ScoreChip label="Best practices" score={psi.bestPractices} />
        </motion.div>
      ) : (
        <motion.p variants={item} className="mt-4 text-xs text-graybrand">
          PageSpeed Insights data wasn&apos;t available for this URL.
        </motion.p>
      )}

      {/* Web findings */}
      <motion.div variants={item} className="mt-6">
        <h3 className="font-heading text-h3-m font-bold text-ink sm:text-h4">
          Website findings
        </h3>
        <ul className="mt-3 flex flex-col gap-2.5">
          {report.web.findings.map((f, i) => (
            <li key={i} className={`rounded-lg border p-3 ${SEVERITY[f.severity] ?? SEVERITY.low}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{f.title}</p>
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">
                  {f.severity}
                </span>
              </div>
              <p className="mt-1 text-sm opacity-90">{f.detail}</p>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Marketing posture */}
      <motion.div variants={item} className="mt-6">
        <h3 className="font-heading text-h3-m font-bold text-ink sm:text-h4">
          Marketing posture
        </h3>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            ["Audience read", marketing.audience_read],
            ["Positioning gap", marketing.positioning_gap],
            ["Marketing footprint", marketing.marketing_footprint],
            ["Competitor stance", marketing.competitor_stance],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-ink/10 bg-cream p-3">
              <dt className="text-xs font-semibold text-graybrand">{label}</dt>
              <dd className="mt-1 text-sm text-ink/90">{value}</dd>
            </div>
          ))}
        </dl>
      </motion.div>

      {/* Recommendations */}
      <motion.div variants={item} className="mt-6">
        <h3 className="font-heading text-h3-m font-bold text-ink sm:text-h4">
          Top recommendations
        </h3>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink/90">
          {report.top_recommendations.map((r, i) => (
            <li key={i} className="leading-relaxed">
              {r}
            </li>
          ))}
        </ol>
      </motion.div>

      {/* Detected tech */}
      {scan?.tech && scan.tech.length > 0 && (
        <motion.div variants={item} className="mt-5">
          <p className="text-xs font-semibold text-graybrand">Detected tech</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {scan.tech.map((t) => (
              <span key={t} className="rounded-full bg-ink/5 px-2.5 py-1 text-xs text-ink/80">
                {t}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Primary CTA from the routing matrix */}
      <motion.div
        variants={item}
        className="mt-7 rounded-xl border border-orange/40 bg-orange/10 p-4"
      >
        <p className="text-sm font-semibold text-ink">{cta.label}</p>
        <p className="mt-0.5 text-sm text-graybrand">{cta.sub}</p>
      </motion.div>

      <motion.div variants={item} className="mt-6 flex flex-wrap items-center gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition hover:border-ink/40"
        >
          Save as PDF
        </button>
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium text-blue underline-offset-4 hover:underline"
        >
          Audit another site
        </button>
        {!persisted && (
          <span className="text-xs text-graybrand">
            (Not saved — Supabase isn&apos;t configured.)
          </span>
        )}
      </motion.div>
    </motion.section>
  );
}
