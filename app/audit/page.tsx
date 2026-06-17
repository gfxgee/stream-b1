import { Suspense } from "react";
import AuditForm from "@/components/audit/AuditForm";

export const metadata = {
  title: "Free Website + Marketing Audit — Digitalfeet",
  description:
    "Get an AI-generated diagnostic of your website and marketing posture in minutes.",
};

export default function AuditPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 sm:mb-10">
        <p className="font-heading text-sm font-medium tracking-wide text-orange-deep">
          Digitalfeet
        </p>
        <h1 className="mt-1 font-heading text-h1-m font-bold text-ink sm:text-h2">
          Free Website &amp; Marketing Audit
        </h1>
        <p className="mt-3 max-w-prose text-base text-graybrand">
          Drop in your site and we&apos;ll generate a diagnostic — performance,
          SEO, and marketing posture — in a few minutes. No call required.
        </p>
      </header>
      <Suspense fallback={null}>
        <AuditForm />
      </Suspense>
      <footer className="mt-8 text-center">
        <a
          href="/"
          className="text-xs text-graybrand underline-offset-2 hover:text-ink hover:underline"
        >
          ← Back to the calculator
        </a>
      </footer>
    </main>
  );
}
