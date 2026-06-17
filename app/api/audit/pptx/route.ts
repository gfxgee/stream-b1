import { buildAuditPptx, type PptxArgs } from "@/lib/audit/pptx";

export const maxDuration = 30;

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "website"
  );
}

export async function POST(request: Request) {
  let body: Partial<PptxArgs>;
  try {
    body = (await request.json()) as Partial<PptxArgs>;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.report || !body.report.dimension_scores || !body.report.recommendations) {
    return Response.json({ error: "Missing audit report." }, { status: 400 });
  }

  try {
    const buffer = await buildAuditPptx({
      company: body.company ?? "Your website",
      url: body.url,
      generatedAt: body.generatedAt ?? new Date().toLocaleDateString("en-GB"),
      report: body.report,
      scan: body.scan ?? null,
      cta: body.cta ?? { label: "Talk to Digitalfeet", sub: "" },
    });

    const filename = `website-audit-${slugify(body.company ?? "")}.pptx`;
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("PPTX generation failed:", err);
    return Response.json(
      { error: "Could not generate the PPTX. Please try again." },
      { status: 500 }
    );
  }
}
