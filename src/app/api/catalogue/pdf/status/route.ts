import { NextResponse } from "next/server";
import { getPdfStatus, toPdfStatusSummary } from "@/lib/pdf-status";

export const dynamic = "force-dynamic";

/** Public, lightweight status endpoint used by the toolbar's "PDF preparing" state. */
export async function GET() {
  const row = await getPdfStatus();
  return NextResponse.json(toPdfStatusSummary(row));
}