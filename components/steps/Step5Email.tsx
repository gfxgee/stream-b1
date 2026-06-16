import { Field, TextInput } from "@/components/ui";
import type { ChosenPath } from "@/lib/types";
import type { StepProps } from "./StepProps";

type Step5Props = StepProps & {
  onChoosePath: (path: ChosenPath) => void;
  submitting: boolean;
};

const PATHS: { path: ChosenPath; label: string; sub: string }[] = [
  {
    path: "email_plan",
    label: "Email me the plan",
    sub: "Get the full plan in your inbox (DIY).",
  },
  {
    path: "book_maia",
    label: "Book a call with Maia",
    sub: "Walk through it together with us.",
  },
  {
    path: "dig_deeper",
    label: "Let me dig deeper",
    sub: "Keep exploring before deciding.",
  },
];

export default function Step5Email({
  data,
  errors,
  update,
  onChoosePath,
  submitting,
}: Step5Props) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-heading text-h3-m font-bold text-ink sm:text-h4">
          Where should we send your plan?
        </h2>
        <p className="mt-1 text-sm text-graybrand">
          Enter your email and choose how you&apos;d like to move forward.
        </p>
      </div>
      <Field label="Email address" htmlFor="email" error={errors.email}>
        <TextInput
          id="email"
          name="email"
          type="email"
          inputMode="email"
          value={data.email}
          error={errors.email}
          onChange={(e) => update({ email: e.target.value })}
          placeholder="you@company.com"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        {PATHS.map(({ path, label, sub }) => (
          <button
            key={path}
            type="button"
            disabled={submitting}
            onClick={() => onChoosePath(path)}
            className="flex flex-col gap-1 rounded-lg border border-ink/15 bg-white p-3 text-left transition hover:border-orange hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-sm font-semibold text-ink">{label}</span>
            <span className="text-xs text-graybrand">{sub}</span>
          </button>
        ))}
      </div>

      <div className="pt-1">
        <button
          type="button"
          disabled={submitting}
          onClick={() => onChoosePath("price_only")}
          className="text-sm font-medium text-blue underline-offset-4 hover:underline disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Just show me the price range →"}
        </button>
        <p className="mt-1 text-xs text-graybrand">
          No email required — see the range and decide later.
        </p>
      </div>
    </div>
  );
}
