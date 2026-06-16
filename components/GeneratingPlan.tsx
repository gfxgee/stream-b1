"use client";

import { motion } from "framer-motion";

export default function GeneratingPlan() {
  return (
    <section
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-ink/10 bg-white p-8 shadow-sm sm:p-10"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="h-9 w-9 animate-spin rounded-full border-[3px] border-orange/30 border-t-orange-deep"
          aria-hidden
        />
        <div>
          <h2 className="font-heading text-h3-m font-bold text-ink sm:text-h4">
            Building your plan…
          </h2>
          <p className="mt-1 text-sm text-graybrand">
            We&apos;re putting together a tailored plan and an honest price
            range. This usually takes a few seconds.
          </p>
        </div>
        <div className="mt-1 flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2 w-2 rounded-full bg-orange-deep"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
