"use client";

import { useReducer } from "react";
import { motion, type Variants } from "framer-motion";
import Stepper from "./Stepper";
import Step1Situation from "./steps/Step1Situation";
import Step2Url from "./steps/Step2Url";
import Step3Scope from "./steps/Step3Scope";
import Step4About from "./steps/Step4About";
import Step5Email from "./steps/Step5Email";
import PlanResult from "./PlanResult";
import GeneratingPlan from "./GeneratingPlan";
import { INITIAL_FORM_DATA, type ChosenPath, type FormData } from "@/lib/types";
import { validateStep, type Errors } from "@/lib/validation";
import type { GeneratedPlan } from "@/lib/gemini";

const TOTAL_STEPS = 5;

type Status = "idle" | "generating" | "done" | "error";

type State = {
  step: number;
  direction: number; // 1 forward, -1 back — drives the slide direction
  data: FormData;
  errors: Errors;
  status: Status;
  submitError: string | null;
  plan: GeneratedPlan | null;
  chosenPath: ChosenPath | null;
  persisted: boolean;
};

type Action =
  | { type: "update"; patch: Partial<FormData> }
  | { type: "next" }
  | { type: "back" }
  | { type: "setErrors"; errors: Errors }
  | { type: "generateStart" }
  | { type: "generateError"; message: string }
  | {
      type: "generateSuccess";
      plan: GeneratedPlan;
      path: ChosenPath;
      persisted: boolean;
    }
  | { type: "reset" };

const initialState: State = {
  step: 1,
  direction: 1,
  data: INITIAL_FORM_DATA,
  errors: {},
  status: "idle",
  submitError: null,
  plan: null,
  chosenPath: null,
  persisted: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "update": {
      const errors = { ...state.errors };
      for (const key of Object.keys(action.patch) as (keyof FormData)[]) {
        delete errors[key];
      }
      return { ...state, data: { ...state.data, ...action.patch }, errors };
    }
    case "next": {
      const errors = validateStep(state.step, state.data);
      if (Object.keys(errors).length > 0) return { ...state, errors };
      return {
        ...state,
        step: Math.min(state.step + 1, TOTAL_STEPS),
        direction: 1,
        errors: {},
      };
    }
    case "back":
      return {
        ...state,
        step: Math.max(state.step - 1, 1),
        direction: -1,
        errors: {},
      };
    case "setErrors":
      return { ...state, errors: action.errors };
    case "generateStart":
      return { ...state, status: "generating", submitError: null };
    case "generateError":
      return { ...state, status: "error", submitError: action.message };
    case "generateSuccess":
      return {
        ...state,
        status: "done",
        plan: action.plan,
        chosenPath: action.path,
        persisted: action.persisted,
      };
    case "reset":
      return initialState;
    default:
      return state;
  }
}

const stepVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 36 : -36, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -36 : 36, opacity: 0 }),
};

const viewVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function CalculatorForm() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    step,
    direction,
    data,
    errors,
    status,
    submitError,
    plan,
    chosenPath,
    persisted,
  } = state;

  const update = (patch: Partial<FormData>) =>
    dispatch({ type: "update", patch });

  const handleChoosePath = async (path: ChosenPath) => {
    if (status === "generating") return;
    if (path !== "price_only") {
      const stepErrors = validateStep(5, data);
      if (Object.keys(stepErrors).length > 0) {
        dispatch({ type: "setErrors", errors: stepErrors });
        return;
      }
    }

    dispatch({ type: "generateStart" });
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, path }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json?.errors) dispatch({ type: "setErrors", errors: json.errors });
        throw new Error(json?.error || "Something went wrong. Please try again.");
      }
      dispatch({
        type: "generateSuccess",
        plan: json.plan,
        path,
        persisted: Boolean(json.persisted),
      });
    } catch (err) {
      dispatch({
        type: "generateError",
        message:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      });
    }
  };

  const view =
    status === "generating" ? "generating" : status === "done" ? "done" : "form";

  if (view === "generating") {
    return (
      <motion.div
        key="generating"
        variants={viewVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.25 }}
      >
        <GeneratingPlan />
      </motion.div>
    );
  }

  if (view === "done" && plan && chosenPath) {
    return (
      <motion.div
        key="done"
        variants={viewVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.25 }}
      >
        <PlanResult
          plan={plan}
          chosenPath={chosenPath}
          persisted={persisted}
          onReset={() => dispatch({ type: "reset" })}
        />
      </motion.div>
    );
  }

  return (
    <motion.section
      key="form"
      variants={viewVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm sm:p-7"
    >
      <Stepper current={step} />

      <div className="relative min-h-[18rem] overflow-hidden">
        {/* Keyed remount per step: the new step slides/fades in reliably. */}
        <motion.div
          key={step}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {step === 1 && <Step1Situation data={data} errors={errors} update={update} />}
          {step === 2 && <Step2Url data={data} errors={errors} update={update} />}
          {step === 3 && <Step3Scope data={data} errors={errors} update={update} />}
          {step === 4 && <Step4About data={data} errors={errors} update={update} />}
          {step === 5 && (
            <Step5Email
              data={data}
              errors={errors}
              update={update}
              onChoosePath={handleChoosePath}
              submitting={false}
            />
          )}
        </motion.div>
      </div>

      {submitError && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 overflow-hidden rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {submitError} {submitError && "Tap a path above to try again."}
        </motion.p>
      )}

      <div className="mt-7 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => dispatch({ type: "back" })}
              disabled={step === 1}
              className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            <span className="text-xs text-graybrand">
              Step {step} of {TOTAL_STEPS}
            </span>
            {step < TOTAL_STEPS ? (
              <motion.button
                type="button"
                onClick={() => dispatch({ type: "next" })}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-gradient-brand rounded-full px-6 py-2.5 text-sm font-semibold text-ink"
              >
                Continue
              </motion.button>
            ) : (
              <span className="w-[4.5rem]" aria-hidden />
            )}
          </div>
    </motion.section>
  );
}
