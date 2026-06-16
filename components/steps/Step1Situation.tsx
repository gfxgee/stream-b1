import { Field, TextArea } from "@/components/ui";
import type { StepProps } from "./StepProps";

export default function Step1Situation({ data, errors, update }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-heading text-h3-m font-bold text-ink sm:text-h4">
          Describe your situation
        </h2>
        <p className="mt-1 text-sm text-graybrand">
          In your own words, what do you want to build or fix? The more context
          you give, the better the plan.
        </p>
      </div>
      <Field
        label="Your situation"
        htmlFor="situation"
        error={errors.situation}
        hint="e.g. We're a small studio with an outdated site and want to start selling courses online."
      >
        <TextArea
          id="situation"
          name="situation"
          rows={6}
          value={data.situation}
          error={errors.situation}
          onChange={(e) => update({ situation: e.target.value })}
          placeholder="Tell us what you're trying to achieve…"
        />
      </Field>
    </div>
  );
}
