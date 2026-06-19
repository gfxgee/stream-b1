"use client";

import { useEffect, useState } from "react";

type Status = "sending" | "success" | "error" | "misconfigured";

type Result = {
  status: Status;
  message: string;
  payload?: Record<string, unknown>;
  webhookUrl?: string;
};

export default function TestPayloadPage() {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    async function sendTestPayload() {
      try {
        const res = await fetch("/api/test-payload", { method: "POST" });
        const json = await res.json();

        if (!res.ok) {
          const isMisconfigured =
            json.error?.includes("ZAPIER_MAIA_WEBHOOK_URL") ||
            res.status === 503;
          setResult({
            status: isMisconfigured ? "misconfigured" : "error",
            message: json.error ?? "Unknown error.",
          });
        } else {
          setResult({
            status: "success",
            message: json.message,
            payload: json.payload,
            webhookUrl: json.webhookUrl,
          });
        }
      } catch {
        setResult({
          status: "error",
          message:
            "Network error — could not reach the API. Is the dev server running?",
        });
      }
    }

    sendTestPayload();
  }, []);

  const icons: Record<Status, string> = {
    sending: "⏳",
    success: "✅",
    error: "❌",
    misconfigured: "⚙️",
  };

  const colors: Record<Status, string> = {
    sending: "text-graybrand",
    success: "text-green-700",
    error: "text-red-600",
    misconfigured: "text-orange-deep",
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <p className="font-heading text-sm font-medium tracking-wide text-orange-deep">
          Digitalfeet · internal
        </p>
        <h1 className="mt-1 font-heading text-h1-m font-bold text-ink sm:text-h2">
          Zapier Test Payload
        </h1>
        <p className="mt-3 max-w-prose text-base text-graybrand">
          Sends a fake Maia brief to your Zapier webhook so you can map fields
          without submitting the full Calculator. Reload the page to send again.
        </p>
      </header>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        {!result ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <p className="text-base font-medium text-graybrand">
              Sending test payload to Zapier…
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-2xl">{icons[result.status]}</span>
              <div>
                <p className={`text-base font-semibold ${colors[result.status]}`}>
                  {result.status === "success" && "Payload sent successfully"}
                  {result.status === "error" && "Something went wrong"}
                  {result.status === "misconfigured" && "Webhook URL not configured"}
                  {result.status === "sending" && "Sending…"}
                </p>
                <p className="mt-1 text-sm text-graybrand">{result.message}</p>
                {result.webhookUrl && (
                  <p className="mt-1 text-xs text-stone-400">
                    Sent to: {result.webhookUrl}
                  </p>
                )}
              </div>
            </div>

            {/* Next step instructions */}
            {result.status === "success" && (
              <div className="rounded-xl bg-stone-50 p-4 text-sm text-ink">
                <p className="font-semibold mb-2">Next steps in Zapier:</p>
                <ol className="list-decimal list-inside space-y-1 text-graybrand">
                  <li>Go to your Zap's Trigger step (Catch Hook)</li>
                  <li>Click <strong>"Test Trigger"</strong></li>
                  <li>Select <strong>"Use this record"</strong> to confirm the payload</li>
                  <li>
                    The fields <code className="bg-stone-200 px-1 rounded text-xs">company</code>,{" "}
                    <code className="bg-stone-200 px-1 rounded text-xs">chosen_path</code>,{" "}
                    <code className="bg-stone-200 px-1 rounded text-xs">maia_brief</code>,{" "}
                    <code className="bg-stone-200 px-1 rounded text-xs">lead_id</code>, and{" "}
                    <code className="bg-stone-200 px-1 rounded text-xs">triggered_at</code>{" "}
                    will now appear in the <strong>+</strong> field picker
                  </li>
                </ol>
              </div>
            )}

            {result.status === "misconfigured" && (
              <div className="rounded-xl bg-orange-50 p-4 text-sm text-ink">
                <p className="font-semibold mb-2">How to fix:</p>
                <ol className="list-decimal list-inside space-y-1 text-graybrand">
                  <li>Go to your Zap in Zapier → Trigger → Catch Hook</li>
                  <li>Copy the webhook URL</li>
                  <li>
                    Add it to Vercel: <strong>Settings → Environment Variables</strong>
                  </li>
                  <li>
                    Key: <code className="bg-orange-100 px-1 rounded text-xs">ZAPIER_MAIA_WEBHOOK_URL</code>
                  </li>
                  <li>Redeploy, then reload this page</li>
                </ol>
              </div>
            )}

            {/* Payload preview */}
            {result.payload && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
                  Payload sent
                </p>
                <pre className="overflow-x-auto rounded-xl bg-stone-950 p-4 text-xs text-stone-200 leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(result.payload, null, 2)}
                </pre>
              </div>
            )}

            {/* Reload button */}
            <button
              onClick={() => {
                setResult(null);
                window.location.reload();
              }}
              className="rounded-xl bg-orange-deep px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Send again
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-stone-400">
        This page is disabled in production. Internal use only.
      </p>
    </main>
  );
}
