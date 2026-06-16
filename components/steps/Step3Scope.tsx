import { Field, Select } from "@/components/ui";
import { BUDGET_BANDS, PROJECT_TYPES, TIMELINES } from "@/lib/types";
import type { StepProps } from "./StepProps";

export default function Step3Scope({ data, errors, update }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-heading text-h3-m font-bold text-ink sm:text-h4">
          Scope signals
        </h2>
        <p className="mt-1 text-sm text-graybrand">
          A few quick details to ground the estimate.
        </p>
      </div>
      <Field label="Rough budget band" htmlFor="budgetBand" error={errors.budgetBand}>
        <Select
          id="budgetBand"
          name="budgetBand"
          value={data.budgetBand}
          error={errors.budgetBand}
          options={BUDGET_BANDS}
          placeholder="Select a budget band…"
          onChange={(e) => update({ budgetBand: e.target.value })}
        />
      </Field>
      <Field label="Timeline" htmlFor="timeline" error={errors.timeline}>
        <Select
          id="timeline"
          name="timeline"
          value={data.timeline}
          error={errors.timeline}
          options={TIMELINES}
          placeholder="Select a timeline…"
          onChange={(e) => update({ timeline: e.target.value })}
        />
      </Field>
      <Field label="Project type" htmlFor="projectType" error={errors.projectType}>
        <Select
          id="projectType"
          name="projectType"
          value={data.projectType}
          error={errors.projectType}
          options={PROJECT_TYPES}
          placeholder="Select a project type…"
          onChange={(e) => update({ projectType: e.target.value })}
        />
      </Field>
    </div>
  );
}
