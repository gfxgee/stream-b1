import ReviewBoard from "@/components/ReviewBoard";

export const metadata = {
  title: "Plan Review — Digitalfeet Calculator",
};

export default function ReviewPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <p className="font-heading text-sm font-medium tracking-wide text-orange-deep">
          Digitalfeet · internal
        </p>
        <h1 className="mt-1 font-heading text-h1-m font-bold text-ink sm:text-h2">
          Plan Review
        </h1>
        <p className="mt-3 max-w-prose text-base text-graybrand">
          Self-score generated plans 1–5 to replay the quality gate (spec §6) —
          target a median of <span className="font-semibold text-ink">3.5</span>.
          Test data only.
        </p>
      </header>
      <ReviewBoard />
    </main>
  );
}
