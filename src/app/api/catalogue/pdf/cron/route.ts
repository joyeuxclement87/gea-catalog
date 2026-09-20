import { NextRequest, NextResponse } from "next/server";
import {
  generateCataloguePdf,
  getPdfStatus,
  toPdfStatusSummary,
  isDebounceElapsed,
} from "@/lib/pdf-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Automatic generation trigger for scheduled environments (cron, pg_cron,
 * Vercel Cron). Checks for an overdue `outdated` status and starts exactly one
 * generation. Since several quick admin edits reset `pending_since`, edits are
 * batched: the PDF is regenerated once the catalogue settles.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.PDF_CRON_SECRET;
  if (secret) {
    const provided = request.headers.get("x-pdf-cron-secret") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const row = await getPdfStatus();
  if (!row) {
    return NextResponse.json(
      { error: "The catalogue PDF status table is unavailable. Run supabase/migrations/20260920_catalogue_pdf.sql." },
      { status: 500 },
    );
  }

  if (row.status === "generating") {
    return NextResponse.json({ skipped: "busy", status: toPdfStatusSummary(row) });
  }
  if (row.status !== "outdated") {
    return NextResponse.json({ skipped: "not-outdated", status: toPdfStatusSummary(row) });
  }
  if (!isDebounceElapsed(row)) {
    return NextResponse.json({ skipped: "debouncing", status: toPdfStatusSummary(row) });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const result = await generateCataloguePdf({ baseUrl });
  return NextResponse.json(result);
}