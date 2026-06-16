"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { formatPrice } from "@/lib/format";

const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const cardItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

type Lead = {
  situation: string;
  company: string;
  industry: string;
  budget_band: string;
  project_type: string;
  timeline: string;
  chosen_path: string;
  email: string | null;
  url: string | null;
};

type PlanRow = {
  id: string;
  created_at: string;
  price_min: number;
  price_max: number;
  currency: string;
  plan_markdown: string;
  quality_score: number | null;
  lead: Lead | Lead[] | null;
};

function leadOf(row: PlanRow): Lead | null {
  if (!row.lead) return null;
  return Array.isArray(row.lead) ? (row.lead[0] ?? null) : row.lead;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export default function ReviewBoard() {
  const [plans, setPlans] = useState<PlanRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setPlans(null);
    try {
      const res = await fetch("/api/plans");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to load plans.");
      setPlans(json.plans as PlanRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load plans.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const scored = useMemo(
    () => (plans ?? []).map((p) => p.quality_score).filter((s): s is number => s != null),
    [plans]
  );
  const med = median(scored);

  async function setScore(id: string, score: number | null) {
    setSavingId(id);
    // Optimistic update.
    setPlans((prev) =>
      prev
        ? prev.map((p) => (p.id === id ? { ...p, quality_score: score } : p))
        : prev
    );
    try {
      const res = await fetch("/api/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quality_score: score }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Save failed.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSavingId(null);
    }
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        <span>{error}</span>
        <button
          type="button"
          onClick={load}
          className="rounded-full border border-red-300 px-4 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
        >
          Try again
        </button>
      </div>
    );
  }
  if (!plans) {
    return (
      <div className="flex flex-col gap-5" aria-busy="true">
        <div className="h-16 animate-pulse rounded-xl bg-ink/5" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-ink/5" />
        ))}
        <span className="sr-only">Loading plans…</span>
      </div>
    );
  }
  if (plans.length === 0) {
    return (
      <p className="rounded-xl border border-ink/10 bg-white p-6 text-sm text-graybrand">
        No plans yet. Generate some from the{" "}
        <a className="text-blue underline" href="/">
          calculator
        </a>{" "}
        first.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SummaryBar count={plans.length} scoredCount={scored.length} median={med} />
      <motion.div
        className="flex flex-col gap-5"
        variants={listContainer}
        initial="hidden"
        animate="show"
      >
        {plans.map((row) => (
          <PlanCard
            key={row.id}
            row={row}
            saving={savingId === row.id}
            onScore={(s) => setScore(row.id, s)}
          />
        ))}
      </motion.div>
    </div>
  );
}

function SummaryBar({
  count,
  scoredCount,
  median,
}: {
  count: number;
  scoredCount: number;
  median: number | null;
}) {
  const onTarget = median != null && median >= 3.5;
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
      <Stat label="Plans" value={String(count)} />
      <Stat label="Scored" value={`${scoredCount} / ${count}`} />
      <Stat
        label="Median score"
        value={median == null ? "—" : median.toFixed(1)}
        accent={median == null ? undefined : onTarget ? "good" : "warn"}
      />
      <span className="text-xs text-graybrand">Target median ≥ 3.5</span>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "good" | "warn";
}) {
  const color =
    accent === "good"
      ? "text-emerald-600"
      : accent === "warn"
        ? "text-orange-deep"
        : "text-ink";
  return (
    <div>
      <p className="text-xs font-medium text-graybrand">{label}</p>
      <p className={`font-heading text-h3-m font-bold ${color}`}>{value}</p>
    </div>
  );
}

const PATH_LABEL: Record<string, string> = {
  email_plan: "Email plan",
  book_maia: "Book Maia",
  dig_deeper: "Dig deeper",
  price_only: "Price only",
};

function PlanCard({
  row,
  saving,
  onScore,
}: {
  row: PlanRow;
  saving: boolean;
  onScore: (score: number | null) => void;
}) {
  const lead = leadOf(row);
  return (
    <motion.article
      variants={cardItem}
      className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading font-bold text-ink">
            {lead?.company || "—"}{" "}
            <span className="text-sm font-normal text-graybrand">
              · {lead?.industry || "—"}
            </span>
          </p>
          <p className="mt-0.5 text-sm text-graybrand">
            {formatPrice(row.price_min, row.currency)} –{" "}
            {formatPrice(row.price_max, row.currency)}
          </p>
        </div>
        <span className="rounded-full bg-blue/10 px-2.5 py-1 text-xs font-medium text-blue">
          {PATH_LABEL[lead?.chosen_path ?? ""] ?? lead?.chosen_path ?? "—"}
        </span>
      </div>

      {lead?.situation && (
        <p className="mt-3 line-clamp-2 text-sm text-ink/80">
          “{lead.situation}”
        </p>
      )}

      <details className="mt-3 group">
        <summary className="cursor-pointer text-xs font-medium text-blue">
          View plan
        </summary>
        <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-cream p-3 text-xs text-ink/90">
          {row.plan_markdown}
        </pre>
      </details>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs font-medium text-graybrand">Quality:</span>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = row.quality_score === n;
          return (
            <motion.button
              key={n}
              type="button"
              disabled={saving}
              onClick={() => onScore(active ? null : n)}
              aria-pressed={active}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              animate={active ? { scale: [1, 1.25, 1] } : { scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`h-8 w-8 rounded-full border text-sm font-semibold disabled:opacity-50 ${
                active
                  ? "border-transparent bg-gradient-brand text-ink"
                  : "border-ink/20 text-ink hover:border-orange"
              }`}
            >
              {n}
            </motion.button>
          );
        })}
        {row.quality_score != null && (
          <button
            type="button"
            disabled={saving}
            onClick={() => onScore(null)}
            className="ml-1 text-xs text-graybrand underline-offset-2 hover:underline disabled:opacity-50"
          >
            clear
          </button>
        )}
      </div>
    </motion.article>
  );
}
