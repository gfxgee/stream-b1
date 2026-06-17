const STEP_LABELS = [
  "Situation",
  "Website",
  "Scope",
  "About you",
  "Get plan",
];

export default function Stepper({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex items-start">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const isDone = step < current;
        const isActive = step === current;
        return (
          <li
            key={label}
            className="relative flex flex-1 flex-col items-center gap-1.5"
          >
            {/* Connector: from this circle's center to the next circle's center,
                vertically aligned to the circle's middle (h-7 → 14px), behind it. */}
            {step < STEP_LABELS.length && (
              <div
                className={`absolute top-[14px] left-[calc(50%_+_18px)] h-0.5 w-[calc(100%_-_36px)] -translate-y-1/2 rounded transition ${
                  isDone ? "bg-orange/50" : "bg-ink/10"
                }`}
              />
            )}
            <div
              className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${
                isActive
                  ? "bg-gradient-brand text-ink"
                  : isDone
                    ? "bg-orange/20 text-orange-deep"
                    : "bg-ink/10 text-graybrand"
              }`}
            >
              {isDone ? "✓" : step}
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
