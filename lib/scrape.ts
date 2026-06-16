// Best-effort extraction of visible text from a submitted URL, used only as
// extra context for the model. Always non-fatal: returns null on any problem.

const TIMEOUT_MS = 6000;
const MAX_CHARS = 2000;

export async function fetchUrlText(rawUrl: string): Promise<string | null> {
  const url = rawUrl.trim();
  if (!url) return null;
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(normalized, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "DigitalfeetCalculatorPOC/0.1 (+context-fetch)" },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text ? text.slice(0, MAX_CHARS) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
