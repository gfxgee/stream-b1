const STEP_LABELS = [
  "Situation",
  "Website",
  "Scope",
  "About you",
  "Get plan",
];

export default function Stepper({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex items-center gap-2">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const isDone = step < current;
        const isActive = step === current;
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                  isActive
                    ? "bg-gradient-brand text-ink"
                    : isDone
                      ? "bg-orange/20 text-orange-deep"
                      : "bg-ink/10 text-graybrand"
                }`}
              >
                {isDone ? "✓" : step}
              </div>
              {step < STEP_LABELS.length && (
                <div
                  className={`mx-1 h-0.5 flex-1 rounded transition ${
                    isDone ? "bg-orange/50" : "bg-ink/10"
                  }`}
                />
              )}
            </div>
            <span
              className={`hidden text-center text-[11px] sm:block ${
                isActive ? "font-medium text-ink" : "text-graybrand"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
