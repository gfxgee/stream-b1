"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Field, Select, TextInput } from "@/components/ui";
import AuditScanning from "./AuditScanning";
import AuditReportView from "./AuditReportView";
import AuditRejected from "./AuditRejected";
import {
  EMPLOYEE_BANDS,
  INDUSTRIES,
  INITIAL_AUDIT_FORM,
  LANGUAGES,
  type AuditFormData,
} from "@/lib/audit/types";
import { validateAuditForm, type AuditErrors } from "@/lib/audit/validation";
import type { Cta } from "@/lib/audit/cta";
import type { AuditReport, ScanResult } from "@/lib/audit/types";

type ScanSummary = Pick<ScanResult, "reachable" | "pageSpeed" | "seo" | "links" | "tech">;

type Status = "idle" | "scanning" | "done" | "rejected" | "error";

const EMPLOYEE_OPTIONS = EMPLOYEE_BANDS.map((b) => b.value);
const INDUSTRY_OPTIONS = INDUSTRIES.map((i) => i.value);

export default function AuditForm() {
  const origin = useSearchParams().get("from") ?? "generic";

  const [data, setData] = useState<AuditFormData>(INITIAL_AUDIT_FORM);
  const [errors, setErrors] = useState<AuditErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [cta, setCta] = useState<Cta | null>(null);
  const [scan, setScan] = useState<ScanSummary | null>(null);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [persisted, setPersisted] = useState(false);

  const update = (patch: Partial<AuditFormData>) => {
    setData((d) => ({ ...d, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch) as (keyof AuditFormData)[]) delete next[k];
      return next;
    });
  };

  async function submit() {
    const validation = validateAuditForm(data);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setStatus("scanning");
    setSubmitError(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, origin }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json?.errors) setErrors(json.errors);
        throw new Error(json?.error || "Something went wrong. Please try again.");
      }
      if (json.qualified === false) {
        setRejectReason(json.reason ?? null);
        setStatus("rejected");
        return;
      }
      setReport(json.report);
      setCta(json.cta);
      setScan(json.scan);
      setPersisted(Boolean(json.persisted));
      setStatus("done");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setStatus("error");
    }
  }

  function reset() {
    setData(INITIAL_AUDIT_FORM);
    setErrors({});
    setReport(null);
    setCta(null);
    setScan(null);
    setRejectReason(null);
    setStatus("idle");
    setSubmitError(null);
  }

  if (status === "scanning") return <AuditScanning />;
  if (status === "rejected") return <AuditRejected reason={rejectReason} onReset={reset} />;
  if (status === "done" && report && cta) {
    return (
      <AuditReportView
        report={report}
        cta={cta}
        scan={scan}
        company={data.company}
        url={data.url}
        persisted={persisted}
        onReset={reset}
      />
    );
  }

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-5">
        <Field label="Website URL" htmlFor="audit-url" error={errors.url}>
          <TextInput
            id="audit-url"
            type="url"
            inputMode="url"
            value={data.url}
            error={errors.url}
            onChange={(e) => update({ url: e.target.value })}
            placeholder="https://yourcompany.com"
          />
        </Field>
        <Field label="Work email" htmlFor="audit-email" error={errors.email}>
          <TextInput
            id="audit-email"
            type="email"
            inputMode="email"
            value={data.email}
            error={errors.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="you@company.com"
          />
        </Field>
        <Field label="Company" htmlFor="audit-company" error={errors.company}>
          <TextInput
            id="audit-company"
            value={data.company}
            error={errors.company}
            onChange={(e) => update({ company: e.target.value })}
            placeholder="Acme AS"
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Team size" htmlFor="audit-employees" error={errors.employees}>
            <Select
              id="audit-employees"
              value={data.employees}
              error={errors.employees}
              options={EMPLOYEE_OPTIONS}
              placeholder="Select team size…"
              onChange={(e) => update({ employees: e.target.value })}
            />
          </Field>
          <Field label="Industry" htmlFor="audit-industry" error={errors.industry}>
            <Select
              id="audit-industry"
              value={data.industry}
              error={errors.industry}
              options={INDUSTRY_OPTIONS}
              placeholder="Select industry…"
              onChange={(e) => update({ industry: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Report language" htmlFor="audit-language" error={errors.language}>
          <Select
            id="audit-language"
            value={data.language}
            error={errors.language}
            options={LANGUAGES}
            placeholder="Select language…"
            onChange={(e) => update({ language: e.target.value })}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="LinkedIn page (optional)"
            htmlFor="audit-linkedin"
            error={errors.linkedin}
          >
            <TextInput
              id="audit-linkedin"
              type="url"
              inputMode="url"
              value={data.linkedin}
              error={errors.linkedin}
              onChange={(e) => update({ linkedin: e.target.value })}
              placeholder="https://linkedin.com/company/…"
            />
          </Field>
          <Field
            label="Other socials (optional)"
            htmlFor="audit-socials"
            error={errors.socials}
          >
            <TextInput
              id="audit-socials"
              value={data.socials}
              error={errors.socials}
              onChange={(e) => update({ socials: e.target.value })}
              placeholder="instagram, facebook, x…"
            />
          </Field>
        </div>
      </div>

      {submitError && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {submitError}
        </p>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={submit}
          className="bg-gradient-brand w-full rounded-full px-6 py-3 text-sm font-semibold text-ink transition hover:opacity-90 sm:w-auto"
        >
          Run my free audit
        </button>
        <p className="mt-2 text-xs text-graybrand">
          We&apos;ll scan your site and email-gate the full report. Takes a few
          minutes.
        </p>
      </div>
    </section>
  );
}
