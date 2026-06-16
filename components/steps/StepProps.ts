import type { FormData } from "@/lib/types";
import type { Errors } from "@/lib/validation";

export type StepProps = {
  data: FormData;
  errors: Errors;
  update: (patch: Partial<FormData>) => void;
};
