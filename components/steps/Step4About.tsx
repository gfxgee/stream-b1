import { Field, Select, TextInput } from "@/components/ui";
import { TEAM_SIZES } from "@/lib/types";
import type { StepProps } from "./StepProps";

export default function Step4About({ data, errors, update }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-heading text-h3-m font-bold text-ink sm:text-h4">
          About you
        </h2>
        <p className="mt-1 text-sm text-graybrand">
          Helps us tailor the plan to your context.
        </p>
      </div>
      <Field label="Company or project name" htmlFor="company" error={errors.company}>
        <TextInput
          id="company"
          name="company"
          value={data.company}
          error={errors.company}
          onChange={(e) => update({ company: e.target.value })}
          placeholder="Acme Studio"
        />
      </Field>
      <Field label="Industry" htmlFor="industry" error={errors.industry}>
        <TextInput
          id="industry"
          name="industry"
          value={data.industry}
          error={errors.industry}
          onChange={(e) => update({ industry: e.target.value })}
          placeholder="e.g. Online education, retail, consulting"
        />
      </Field>
      <Field label="Team size" htmlFor="teamSize" error={errors.teamSize}>
        <Select
          id="teamSize"
          name="teamSize"
          value={data.teamSize}
          error={errors.teamSize}
          options={TEAM_SIZES}
          placeholder="Select a team size…"
          onChange={(e) => update({ teamSize: e.target.value })}
        />
      </Field>
    </div>
  );
}
