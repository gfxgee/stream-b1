"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import Markdown from "react-markdown";
import type { ComponentProps } from "react";
import type { GeneratedPlan } from "@/lib/gemini";
import type { ChosenPath } from "@/lib/types";
import { formatPrice } from "@/lib/format";

// Counts a number up from 0 to `target` on mount (easeOutCubic), via rAF.
// A setTimeout fallback guarantees the final value is shown even when rAF is
// paused (e.g. a non-painting/background tab), so the price never sticks at 0.
function useCountUp(target: number, durationMs = 900): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    let startTs = 0;
    const tick = (now: number) => {
      if (!startTs) startTs = now;
      const t = Math.min(1, (now - startTs) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    const fallback = setTimeout(() => setVal(target), durationMs + 150);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [target, durationMs]);
  return val;
}

// Branded renderers so the model's markdown matches the design system.
const mdComponents = {
  h1: (p: ComponentProps<"h1">) => (
    <h3 className="font-heading mt-5 mb-2 text-h3-m font-bold text-ink first:mt-0" {...p} />
  ),
  h2: (p: ComponentProps<"h2">) => (
    <h3 className="font-heading mt-5 mb-2 text-h3-m font-bold text-ink first:mt-0" {...p} />
  ),
  h3: (p: ComponentProps<"h3">) => (
    <h4 className="font-heading mt-4 mb-2 text-base font-bold text-ink first:mt-0" {...p} />
  ),
  p: (p: ComponentProps<"p">) => (
    <p className="my-2 text-sm leading-relaxed text-ink/90" {...p} />
  ),
  ul: (p: ComponentProps<"ul">) => (
    <ul className="my-2 list-disc space-y-1 pl-5 text-sm text-ink/90" {...p} />
  ),
  ol: (p: ComponentProps<"ol">) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 text-sm text-ink/90" {...p} />
  ),
  li: (p: ComponentProps<"li">) => <li className="leading-relaxed" {...p} />,
  strong: (p: ComponentProps<"strong">) => (
    <strong className="font-semibold text-ink" {...p} />
  ),
  a: (p: ComponentProps<"a">) => (
    <a className="text-blue underline underline-offset-2" {...p} />
  ),
};

const PATH_ACK: Record<
  Exclude<ChosenPath, "price_only">,
  { title: string; body: string }
> = {
  email_plan: {
    title: "We'll email you this plan",
    body: "Take it and run with it — it's yours to act on at your own pace.",
  },
  book_maia: {
    title: "Let's talk it through",
    body: "Maia will reach out to book a short call and walk through the plan with you.",
  },
  dig_deeper: {
    title: "Take your time",
    body: "Keep exploring — your plan and range are saved so you can revisit when ready.",
  },
};

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function PlanResult({
  plan,
  chosenPath,
  persisted,
  onReset,
}: {
  plan: GeneratedPlan;
  chosenPath: ChosenPath;
  persisted: boolean;
  onReset: () => void;
}) {
  const priceOnly = chosenPath === "price_only";
  const min = useCountUp(plan.price_min);
  const max = useCountUp(plan.price_max);

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm sm:p-7"
    >
      <motion.p
        variants={item}
        className="font-heading text-sm font-medium tracking-wide text-orange-deep"
      >
        Your estimate
      </motion.p>

      {/* Price range — always shown, counts up */}
      <motion.div
        variants={item}
        className="mt-2 rounded-xl border border-ink/10 bg-cream p-5"
      >
        <p className="text-xs font-medium text-graybrand">Estimated range</p>
        <p className="font-heading mt-1 text-h3-m font-bold text-ink sm:text-h3 tabular-nums">
          {formatPrice(min, plan.currency)} – {formatPrice(max, plan.currency)}
        </p>
        <p className="mt-2 text-sm text-graybrand">{plan.rationale}</p>
      </motion.div>

      {priceOnly ? (
        <motion.p variants={item} className="mt-5 text-sm text-ink/90">
          That&apos;s your ballpark range. When you&apos;re ready for the full
          plan and next steps, we&apos;re here — no pressure.
        </motion.p>
      ) : (
        <>
          <motion.div
            variants={item}
            className="mt-5 rounded-xl border border-blue/30 bg-blue/5 p-4"
          >
            <p className="text-sm font-semibold text-ink">
              {PATH_ACK[chosenPath].title}
            </p>
            <p className="mt-1 text-sm text-graybrand">
              {PATH_ACK[chosenPath].body}
            </p>
          </motion.div>

          <motion.div variants={item} className="mt-5">
            <h2 className="font-heading text-h3-m font-bold text-ink sm:text-h4">
              Your plan
            </h2>
            <div className="mt-2">
              <Markdown components={mdComponents}>{plan.plan_markdown}</Markdown>
            </div>
          </motion.div>
        </>
      )}

      <motion.div variants={item} className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition hover:border-ink/40"
        >
          Start over
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
