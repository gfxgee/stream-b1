import CalculatorForm from "@/components/CalculatorForm";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 sm:mb-10">
        <p className="font-heading text-sm font-medium tracking-wide text-orange-deep">
          Digitalfeet
        </p>
        <h1 className="mt-1 font-heading text-h1-m font-bold text-ink sm:text-h2">
          Project Calculator
        </h1>
        <p className="mt-3 max-w-prose text-base text-graybrand">
          Tell us about your project in a few steps. We&apos;ll put together a
          tailored plan and an honest price range — no fixed formulas.
        </p>
      </header>
      <CalculatorForm />
      <footer className="mt-8 text-center">
        <a
          href="/review"
          className="text-xs text-graybrand underline-offset-2 hover:text-ink hover:underline"
        >
          Plan review (internal)
        </a>
      </footer>
    </main>
  );
}
