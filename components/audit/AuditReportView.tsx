"use client";

import { motion, type Variants } from "framer-motion";
import type { Cta } from "@/lib/audit/cta";
import {
  DIMENSION_LABEL,
  REC_CATEGORY_LABEL,
  type AuditReport,
  type DimensionScores,
  type DominantPattern,
  type Priority,
  type ScanResult,
} from "@/lib/audit/types";

type ScanSummary = Pick<ScanResult, "reachable" | "pageSpeed" | "seo" | "links" | "tech">;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
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

const PRIORITY_STYLE: Record<Priority, string> = {
  high: "border-red-300 bg-red-50 text-red-700",
  medium: "border-orange/40 bg-orange/10 text-orange-deep",
  low: "border-ink/15 bg-cream text-graybrand",
};
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function barColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 45) return "bg-orange-deep";
  return "bg-red-500";
}

function DimensionBars({ scores }: { scores: DimensionScores }) {
  const keys = Object.keys(DIMENSION_LABEL) as (keyof DimensionScores)[];
  return (
    <div className="flex flex-col gap-2.5">
      {keys.map((k) => {
        const score = clampScore(scores[k] ?? 0);
        return (
          <div key={k} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs font-medium text-graybrand">
              {DIMENSION_LABEL[k]}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/10">
              <motion.div
                className={`h-full rounded-full ${barColor(score)}`}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-ink">
              {score}
            </span>
          </div>
        );
      })}
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
  const recs = [...report.recommendations].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  );
  const psi = scan?.pageSpeed;

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm sm:p-7"
    >
      <motion.div variants={item} className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-heading text-sm font-medium tracking-wide text-orange-deep">
            Website audit · {company}
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

      {/* Dimension scores chart */}
      <motion.div variants={item} className="mt-6 rounded-xl border border-ink/10 bg-cream p-4">
        <p className="mb-3 text-xs font-semibold text-graybrand">Dimension scores (out of 100)</p>
        <DimensionBars scores={report.dimension_scores} />
        {psi?.available && (
          <p className="mt-3 text-[11px] text-graybrand">
            Measured by PageSpeed Insights (mobile): performance {psi.performance ?? "—"},
            SEO {psi.seo ?? "—"}, accessibility {psi.accessibility ?? "—"}.
          </p>
        )}
      </motion.div>

      {/* Recommended actions */}
      <motion.div variants={item} className="mt-6">
        <h3 className="font-heading text-h3-m font-bold text-ink sm:text-h4">
          Recommended actions
        </h3>
        <div className="mt-3 flex flex-col gap-2.5">
          {recs.map((r, i) => (
            <div
              key={i}
              className="rounded-lg border border-ink/10 bg-white p-3.5 transition hover:border-ink/20"
            >
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-blue/10 px-2.5 py-0.5 text-[11px] font-medium text-blue">
                  {REC_CATEGORY_LABEL[r.category]}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${PRIORITY_STYLE[r.priority]}`}
                >
                  {r.priority}
                </span>
              </div>
              <p className="text-sm font-semibold text-ink">{r.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/90">
                <span className="text-graybrand">Why: </span>
                {r.reason}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink/90">
                <span className="text-graybrand">Fix: </span>
                {r.fix}
              </p>
            </div>
          ))}
        </div>
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

      {/* Primary CTA from the routing matrix — no pricing here */}
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
