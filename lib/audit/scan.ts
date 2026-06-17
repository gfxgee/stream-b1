import * as cheerio from "cheerio";
import type { ScanResult } from "./types";

const UA = "DigitalfeetAuditPOC/0.1 (+diagnostic)";
const FETCH_TIMEOUT = 12000;
const PSI_TIMEOUT = 28000;
const LINK_SAMPLE = 8;

function normalizeUrl(raw: string): string {
  const v = raw.trim();
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

async function withTimeout(url: string, ms: number, method = "GET") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": UA },
    });
  } finally {
    clearTimeout(timer);
  }
}

// Lightweight tech sniff from HTML/markup (a free stand-in for BuiltWith).
function detectTech(html: string, $: cheerio.CheerioAPI): string[] {
  const tech = new Set<string>();
  const generator = $('meta[name="generator"]').attr("content");
  if (generator) tech.add(generator.split(" ")[0]);
  const signatures: [RegExp, string][] = [
    [/wp-content|wp-includes/i, "WordPress"],
    [/\/_next\//i, "Next.js"],
    [/cdn\.shopify\.com|Shopify\./i, "Shopify"],
    [/static\.wixstatic\.com|wix\.com/i, "Wix"],
    [/squarespace\.com|static1\.squarespace/i, "Squarespace"],
    [/webflow\.com|wf-/i, "Webflow"],
    [/gatsby/i, "Gatsby"],
    [/drupal/i, "Drupal"],
    [/joomla/i, "Joomla"],
    [/googletagmanager\.com/i, "Google Tag Manager"],
    [/google-analytics\.com|gtag\(/i, "Google Analytics"],
    [/hubspot/i, "HubSpot"],
    [/react/i, "React"],
  ];
  for (const [re, name] of signatures) if (re.test(html)) tech.add(name);
  return [...tech].slice(0, 12);
}

async function scrape(url: string): Promise<Pick<ScanResult, "seo" | "links" | "tech" | "textExcerpt" | "reachable">> {
  let res: Response;
  try {
    res = await withTimeout(url, FETCH_TIMEOUT);
  } catch {
    return { reachable: false, seo: null, links: null, tech: [], textExcerpt: null };
  }
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/html")) {
    return { reachable: res.ok, seo: null, links: null, tech: [], textExcerpt: null };
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const base = new URL(url);

  const title = $("title").first().text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() || null;
  const h1Text = $("h1")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  $("script, style, noscript").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  let imagesTotal = 0;
  let imagesMissingAlt = 0;
  $("img").each((_, el) => {
    imagesTotal++;
    const alt = $(el).attr("alt");
    if (!alt || !alt.trim()) imagesMissingAlt++;
  });

  // Collect links, split internal/external, sample a few for broken-link checks.
  const hrefs = $("a[href]")
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter((h): h is string => !!h && !h.startsWith("#") && !h.startsWith("mailto:") && !h.startsWith("tel:"));
  let internal = 0;
  let external = 0;
  const absolute: string[] = [];
  for (const h of hrefs) {
    try {
      const abs = new URL(h, base);
      if (abs.protocol !== "http:" && abs.protocol !== "https:") continue;
      if (abs.hostname === base.hostname) internal++;
      else external++;
      absolute.push(abs.toString());
    } catch {
      /* ignore malformed */
    }
  }

  const sample = [...new Set(absolute)].slice(0, LINK_SAMPLE);
  const broken: { url: string; status: number | string }[] = [];
  await Promise.all(
    sample.map(async (link) => {
      try {
        const r = await withTimeout(link, 6000, "HEAD");
        if (r.status >= 400) broken.push({ url: link, status: r.status });
      } catch {
        broken.push({ url: link, status: "unreachable" });
      }
    })
  );

  return {
    reachable: true,
    tech: detectTech(html, $),
    textExcerpt: bodyText.slice(0, 1500) || null,
    seo: {
      title,
      titleLength: title?.length ?? 0,
      metaDescription,
      metaDescriptionLength: metaDescription?.length ?? 0,
      h1Count: h1Text.length,
      h1Text: h1Text.slice(0, 5),
      wordCount: bodyText ? bodyText.split(/\s+/).length : 0,
      imagesTotal,
      imagesMissingAlt,
      hasViewport: $('meta[name="viewport"]').length > 0,
      hasCanonical: $('link[rel="canonical"]').length > 0,
      lang: $("html").attr("lang") || null,
    },
    links: { internal, external, checkedSample: sample.length, broken },
  };
}

type PsiCategory = { score?: number };
async function pageSpeed(url: string): Promise<ScanResult["pageSpeed"]> {
  const empty: ScanResult["pageSpeed"] = {
    available: false,
    performance: null,
    seo: null,
    accessibility: null,
    bestPractices: null,
    metrics: {},
  };
  try {
    const params = new URLSearchParams({ url, strategy: "mobile" });
    for (const c of ["performance", "seo", "accessibility", "best-practices"])
      params.append("category", c);
    if (process.env.PAGESPEED_API_KEY)
      params.set("key", process.env.PAGESPEED_API_KEY);
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`;
    const res = await withTimeout(endpoint, PSI_TIMEOUT);
    if (!res.ok) return empty;
    const data = await res.json();
    const cats = data?.lighthouseResult?.categories ?? {};
    const toScore = (c?: PsiCategory) =>
      typeof c?.score === "number" ? Math.round(c.score * 100) : null;
    const audits = data?.lighthouseResult?.audits ?? {};
    const metrics: Record<string, string> = {};
    for (const k of [
      "first-contentful-paint",
      "largest-contentful-paint",
      "cumulative-layout-shift",
      "total-blocking-time",
      "speed-index",
    ]) {
      if (audits[k]?.displayValue) metrics[k] = audits[k].displayValue;
    }
    return {
      available: true,
      performance: toScore(cats.performance),
      seo: toScore(cats.seo),
      accessibility: toScore(cats.accessibility),
      bestPractices: toScore(cats["best-practices"]),
      metrics,
    };
  } catch {
    return empty;
  }
}

// Runs the scrape and PageSpeed in parallel. Always resolves (best-effort).
export async function runScan(rawUrl: string): Promise<ScanResult> {
  const url = normalizeUrl(rawUrl);
  const [scraped, psi] = await Promise.all([scrape(url), pageSpeed(url)]);
  return { fetchedUrl: url, ...scraped, pageSpeed: psi };
}
