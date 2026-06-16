import type { ReactNode } from "react";

const inputBase =
  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-graybrand/70 outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/25";

function borderClass(error?: string) {
  return error ? "border-red-500" : "border-ink/15";
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {hint && <p className="text-xs text-graybrand">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function TextInput({
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      className={`${inputBase} ${borderClass(error)} ${className ?? ""}`}
      {...props}
    />
  );
}

export function TextArea({
  error,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <textarea
      className={`${inputBase} resize-y ${borderClass(error)} ${className ?? ""}`}
      {...props}
    />
  );
}

export function Select({
  error,
  options,
  placeholder,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  options: readonly string[];
  placeholder?: string;
}) {
  return (
    <select
      className={`${inputBase} ${borderClass(error)} ${className ?? ""}`}
      {...props}
    >
      <option value="" disabled>
        {placeholder ?? "Select…"}
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
