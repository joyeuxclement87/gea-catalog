import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { generateCataloguePdf, getPdfStatus } from "@/lib/pdf-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Manual generation (admin "Generate PDF" / "Retry Generation"). Runs the
 * full pipeline synchronously; returns 409 when another job is already running
 * so two generations never happen at the same time.
 */
export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const row = await getPdfStatus();
  if (!row) {
    return NextResponse.json(
      { error: "The catalogue PDF status table is unavailable. Run supabase/migrations/20260920_catalogue_pdf.sql." },
      { status: 500 },
    );
  }
  if (row.status === "generating") {
    return NextResponse.json({ error: "A catalogue PDF generation is already running." }, { status: 409 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const result = await generateCataloguePdf({ baseUrl, manual: true });
  return NextResponse.json(result);
}