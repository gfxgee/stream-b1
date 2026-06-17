import pptxgen from "pptxgenjs";
import {
  DIMENSION_LABEL,
  REC_CATEGORY_LABEL,
  type AuditReport,
  type DimensionScores,
  type Priority,
  type ScanResult,
} from "./types";

type ScanSummary = Pick<ScanResult, "pageSpeed" | "tech">;

export type PptxArgs = {
  company: string;
  url?: string;
  generatedAt: string; // pre-formatted date string
  report: AuditReport;
  scan: ScanSummary | null;
  cta: { label: string; sub: string };
};

// Digitalfeet palette (from the sample deck + design system)
const PURPLE = "1E1242";
const INK = "131028";
const ORANGE = "E97132";
const BLUE = "009FE3";
const GRAY = "747474";
const WHITE = "FFFFFF";
const TRACK = "E3E1EA";
const GREEN = "2FA37A";
const AMBER = "E9A23B";
const RED = "E2574C";

const HEAD = "Aptos Display";
const BODY = "Aptos";

function scoreColor(s: number): string {
  if (s >= 70) return GREEN;
  if (s >= 45) return AMBER;
  return RED;
}

const PRIORITY_COLOR: Record<Priority, string> = {
  high: RED,
  medium: AMBER,
  low: GRAY,
};

const PATTERN_LABEL: Record<string, string> = {
  website: "Website-led",
  marketing: "Marketing-led",
  mixed: "Mixed (web + marketing)",
  quickfix_only: "Quick fixes only",
};

const CWV_LABEL: Record<string, string> = {
  "first-contentful-paint": "First Contentful Paint",
  "largest-contentful-paint": "Largest Contentful Paint",
  "cumulative-layout-shift": "Cumulative Layout Shift",
  "total-blocking-time": "Total Blocking Time",
  "speed-index": "Speed Index",
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function buildAuditPptx(args: PptxArgs): Promise<Buffer> {
  const { company, url, generatedAt, report, scan, cta } = args;
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5"
  pptx.defineSlideMaster({ title: "DF", background: { color: WHITE } });

  const W = 13.33;
  const MX = 0.6; // horizontal margin
  const CW = W - MX * 2;

  // helper: section eyebrow + title on a white content slide
  const contentHeader = (slide: pptxgen.Slide, eyebrow: string, title: string) => {
    slide.addText(eyebrow.toUpperCase(), {
      x: MX, y: 0.45, w: CW, h: 0.3,
      fontFace: BODY, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1,
    });
    slide.addText(title, {
      x: MX, y: 0.72, w: CW, h: 0.6,
      fontFace: HEAD, fontSize: 28, bold: true, color: INK,
    });
  };

  // ---- Slide 1: cover (purple) ----
  const cover = pptx.addSlide();
  cover.background = { color: PURPLE };
  cover.addText("DIGITALFEET", {
    x: MX, y: 0.6, w: CW, h: 0.3,
    fontFace: BODY, fontSize: 12, bold: true, color: ORANGE, charSpacing: 2,
  });
  cover.addText("Website Audit", {
    x: MX, y: 2.6, w: CW, h: 1.1,
    fontFace: HEAD, fontSize: 48, bold: true, color: WHITE,
  });
  cover.addText(company || "Your website", {
    x: MX, y: 3.7, w: CW, h: 0.6,
    fontFace: BODY, fontSize: 22, color: "CADCFC",
  });
  cover.addText(
    [
      url ? { text: url, options: { color: "B9B4D6" } } : { text: "", options: {} },
      { text: url ? "   ·   " : "", options: { color: "6E6790" } },
      { text: generatedAt, options: { color: "B9B4D6" } },
    ],
    { x: MX, y: 4.35, w: CW, h: 0.4, fontFace: BODY, fontSize: 13 }
  );

  // ---- Slide 2: overview (white) ----
  const ov = pptx.addSlide();
  contentHeader(ov, "Audit", "Overview");
  ov.addText(PATTERN_LABEL[report.dominant_pattern] ?? report.dominant_pattern, {
    x: MX, y: 1.5, w: 3.2, h: 0.4,
    fontFace: BODY, fontSize: 12, bold: true, color: BLUE,
    fill: { color: "E6F4FB" }, align: "center", valign: "middle", rectRadius: 0.1,
    shape: pptx.ShapeType.roundRect,
  });
  ov.addText(report.overall_summary, {
    x: MX, y: 2.15, w: CW, h: 4.4,
    fontFace: BODY, fontSize: 16, color: INK, lineSpacingMultiple: 1.3,
    valign: "top", fit: "shrink",
  });

  // ---- Slide 3: dimension scores (white) — ring gauges ----
  const dim = pptx.addSlide();
  contentHeader(dim, "Audit", "Dimension scores");
  const keys = Object.keys(DIMENSION_LABEL) as (keyof DimensionScores)[];
  const cell = CW / keys.length;
  const gaugeW = 1.6;
  const gaugeY = 2.3;
  keys.forEach((k, i) => {
    const score = clamp(report.dimension_scores[k] ?? 0);
    const gx = MX + i * cell + (cell - gaugeW) / 2;
    dim.addChart(
      pptx.ChartType.doughnut,
      [{ name: String(k), labels: ["score", "rest"], values: [score, 100 - score] }],
      {
        x: gx, y: gaugeY, w: gaugeW, h: gaugeW,
        holeSize: 66, chartColors: [scoreColor(score), TRACK],
        showLegend: false, showTitle: false, showValue: false,
        dataBorder: { pt: 0, color: WHITE },
      }
    );
    dim.addText(String(score), {
      x: gx, y: gaugeY, w: gaugeW, h: gaugeW,
      align: "center", valign: "middle", fontFace: HEAD, fontSize: 22, bold: true, color: INK,
    });
    dim.addText(DIMENSION_LABEL[k], {
      x: MX + i * cell, y: gaugeY + gaugeW + 0.1, w: cell, h: 0.4,
      align: "center", fontFace: BODY, fontSize: 12, color: GRAY,
    });
  });
  // legend
  dim.addText(
    [
      { text: "● ", options: { color: GREEN } },
      { text: "70–100 healthy     ", options: { color: GRAY } },
      { text: "● ", options: { color: AMBER } },
      { text: "45–69 needs work     ", options: { color: GRAY } },
      { text: "● ", options: { color: RED } },
      { text: "0–44 weak", options: { color: GRAY } },
    ],
    { x: MX, y: 6.0, w: CW, h: 0.4, align: "center", fontFace: BODY, fontSize: 12 }
  );

  // ---- Slide 4: performance & Core Web Vitals (only if PSI available) ----
  const psi = scan?.pageSpeed;
  if (psi?.available) {
    const perf = pptx.addSlide();
    contentHeader(perf, "Audit", "Performance & Core Web Vitals");
    const stats: [string, number | null][] = [
      ["Performance", psi.performance],
      ["SEO", psi.seo],
      ["Accessibility", psi.accessibility],
      ["Best practices", psi.bestPractices],
    ];
    const sCell = CW / 4;
    stats.forEach(([label, val], i) => {
      const sx = MX + i * sCell;
      perf.addText(val == null ? "—" : String(val), {
        x: sx, y: 1.7, w: sCell, h: 0.9,
        align: "center", fontFace: HEAD, fontSize: 40, bold: true,
        color: val == null ? GRAY : scoreColor(val),
      });
      perf.addText(label, {
        x: sx, y: 2.6, w: sCell, h: 0.4,
        align: "center", fontFace: BODY, fontSize: 12, color: GRAY,
      });
    });
    const metrics = Object.entries(psi.metrics ?? {});
    if (metrics.length) {
      perf.addText("Lab metrics (mobile)", {
        x: MX, y: 3.5, w: CW, h: 0.35, fontFace: BODY, fontSize: 13, bold: true, color: INK,
      });
      metrics.slice(0, 6).forEach(([key, value], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const mx = MX + col * (CW / 2);
        const my = 3.95 + row * 0.75;
        perf.addText(
          [
            { text: (CWV_LABEL[key] ?? key) + "\n", options: { color: GRAY, fontSize: 11 } },
            { text: value, options: { color: INK, fontSize: 18, bold: true } },
          ],
          { x: mx, y: my, w: CW / 2 - 0.3, h: 0.7, fontFace: BODY, valign: "top" }
        );
      });
    }
  }

  // ---- Recommended actions (white, paginated 4 per slide) ----
  const recs = [...report.recommendations].sort((a, b) => {
    const rank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
    return rank[a.priority] - rank[b.priority];
  });
  const PER = 4;
  for (let p = 0; p < Math.max(1, Math.ceil(recs.length / PER)); p++) {
    const slide = pptx.addSlide();
    contentHeader(
      slide,
      "Audit",
      recs.length > PER ? `Recommended actions (${p + 1})` : "Recommended actions"
    );
    const chunk = recs.slice(p * PER, p * PER + PER);
    const cardH = 1.25;
    const gap = 0.12;
    chunk.forEach((r, i) => {
      const y = 1.45 + i * (cardH + gap);
      slide.addShape(pptx.ShapeType.roundRect, {
        x: MX, y, w: CW, h: cardH,
        fill: { color: "F7F6F2" }, line: { color: TRACK, width: 0.5 }, rectRadius: 0.06,
      });
      slide.addText(
        [
          { text: r.priority.toUpperCase(), options: { color: PRIORITY_COLOR[r.priority], bold: true } },
          { text: "   •   " + (REC_CATEGORY_LABEL[r.category] ?? r.category), options: { color: GRAY } },
        ],
        { x: MX + 0.25, y: y + 0.1, w: CW - 0.5, h: 0.25, fontFace: BODY, fontSize: 10 }
      );
      slide.addText(r.title, {
        x: MX + 0.25, y: y + 0.34, w: CW - 0.5, h: 0.3,
        fontFace: HEAD, fontSize: 14, bold: true, color: INK,
      });
      slide.addText(
        [
          { text: "Why: ", options: { color: GRAY } },
          { text: r.reason, options: { color: INK } },
        ],
        { x: MX + 0.25, y: y + 0.64, w: CW - 0.5, h: 0.26, fontFace: BODY, fontSize: 10.5, fit: "shrink" }
      );
      slide.addText(
        [
          { text: "Fix: ", options: { color: GRAY } },
          { text: r.fix, options: { color: INK } },
        ],
        { x: MX + 0.25, y: y + 0.9, w: CW - 0.5, h: 0.26, fontFace: BODY, fontSize: 10.5, fit: "shrink" }
      );
    });
  }

  // ---- Final: next step (purple) ----
  const end = pptx.addSlide();
  end.background = { color: PURPLE };
  end.addText("RECOMMENDED NEXT STEP", {
    x: MX, y: 2.5, w: CW, h: 0.3,
    fontFace: BODY, fontSize: 12, bold: true, color: ORANGE, charSpacing: 2,
  });
  end.addText(cta.label, {
    x: MX, y: 2.85, w: CW, h: 0.8,
    fontFace: HEAD, fontSize: 34, bold: true, color: WHITE,
  });
  end.addText(cta.sub, {
    x: MX, y: 3.75, w: CW, h: 0.5,
    fontFace: BODY, fontSize: 16, color: "CADCFC",
  });
  end.addText("Digitalfeet · this audit carries no pricing — scope a project in the calculator.", {
    x: MX, y: 6.7, w: CW, h: 0.3,
    fontFace: BODY, fontSize: 11, color: "8C86A8",
  });

  const out = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return out;
}
