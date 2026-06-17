"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const STEPS = [
  "Fetching your site…",
  "Running PageSpeed Insights…",
  "Checking SEO & broken links…",
  "Reading your marketing posture…",
  "Writing your report…",
];

export default function AuditScanning() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    // Advance the checklist roughly in step with a typical scan (~20–30s).
    const id = setInterval(
      () => setActive((a) => Math.min(a + 1, STEPS.length - 1)),
      4500
    );
    return () => clearInterval(id);
  }, []);

  return (
    <section
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-ink/10 bg-white p-8 shadow-sm sm:p-10"
    >
      <div className="mx-auto flex max-w-sm flex-col gap-5">
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 shrink-0 animate-spin rounded-full border-[3px] border-orange/30 border-t-orange-deep"
            aria-hidden
          />
          <h2 className="font-heading text-h3-m font-bold text-ink sm:text-h4">
            Auditing your site…
          </h2>
        </div>
        <ul className="flex flex-col gap-2">
          {STEPS.map((label, i) => {
            const done = i < active;
            const current = i === active;
            return (
              <li key={label} className="flex items-center gap-2 text-sm">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    done
                      ? "bg-orange/20 text-orange-deep"
                      : current
                        ? "bg-gradient-brand text-ink"
                        : "bg-ink/10 text-graybrand"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className={current || done ? "text-ink" : "text-graybrand"}>
                  {label}
                </span>
                {current && (
                  <motion.span
                    className="ml-1 h-1.5 w-1.5 rounded-full bg-orange-deep"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
