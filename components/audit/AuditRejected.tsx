"use client";

const MESSAGES: Record<string, string> = {
  team_too_small:
    "Our audit is tuned for teams of around four or more — at your current size, a full diagnostic would mostly tell you things you already know.",
  industry_not_it:
    "Our audit is tuned for software, e-commerce, and other IT-related businesses, so it wouldn't do your industry justice right now.",
};

export default function AuditRejected({
  reason,
  onReset,
}: {
  reason: string | null;
  onReset: () => void;
}) {
  const body =
    (reason && MESSAGES[reason]) ||
    "This audit isn't the right fit for your situation right now.";

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-heading text-h3-m font-bold text-ink sm:text-h4">
        Thanks for your interest
      </h2>
      <p className="mt-2 text-sm text-ink/90">{body}</p>
      <p className="mt-3 text-sm text-graybrand">
        If you&apos;d still like help, the{" "}
        <a className="text-blue underline underline-offset-2" href="/">
          project calculator
        </a>{" "}
        is a better starting point — it works for teams of any size.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition hover:border-ink/40"
      >
        Back to the form
      </button>
    </section>
  );
}
