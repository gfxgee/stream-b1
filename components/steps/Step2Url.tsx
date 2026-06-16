import { Field, TextInput } from "@/components/ui";
import type { StepProps } from "./StepProps";

export default function Step2Url({ data, errors, update }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-heading text-h3-m font-bold text-ink sm:text-h4">
          Your current website
        </h2>
        <p className="mt-1 text-sm text-graybrand">
          If you have a site already, drop the link. We may use it for context.
          Leave it blank if you&apos;re starting fresh.
        </p>
      </div>
      <Field
        label="Website URL (optional)"
        htmlFor="url"
        error={errors.url}
      >
        <TextInput
          id="url"
          name="url"
          type="url"
          inputMode="url"
          value={data.url}
          error={errors.url}
          onChange={(e) => update({ url: e.target.value })}
          placeholder="https://yourcompany.com"
        />
      </Field>
    </div>
  );
}
