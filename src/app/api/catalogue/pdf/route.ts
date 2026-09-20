import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getPdfStatus, PDF_BUCKET, PDF_FILE_PATH, PDF_FILE_NAME } from "@/lib/pdf-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public download endpoint for the one current catalogue PDF. It always serves
 * the latest successfully generated file (even while a new one is generating)
 * and never destroys or regenerates on demand. When no PDF exists yet, it
 * returns 404 so the UI can show a "PDF preparing" state.
 */
export async function GET() {
  const supabase = createServiceClient();
  const status = await getPdfStatus();

  const hasPdf = Boolean(status && status.generated_at && (status.file_size ?? 0) > 0);
  if (!status || !hasPdf) {
    return NextResponse.json(
      {
        error: "PDF_PREPARING",
        message: "The catalogue PDF is being prepared. Please check back shortly.",
      },
      { status: 404 },
    );
  }

  const { data, error } = await supabase.storage.from(PDF_BUCKET).download(PDF_FILE_PATH);
  if (error || !data) {
    return NextResponse.json(
      {
        error: "PDF_UNAVAILABLE",
        message: "The catalogue PDF is temporarily unavailable. Please try again in a moment.",
      },
      { status: 404 },
    );
  }

  const bytes = Buffer.from(await data.arrayBuffer());

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `attachment; filename="${PDF_FILE_NAME}"`,
      // The file is replaced in place at the same path — revalidate on every
      // request so browsers/CDNs never keep serving an outdated copy, while
      // the visible filename stays fixed.
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Last-Modified": status.generated_at
        ? new Date(status.generated_at).toUTCString()
        : new Date().toUTCString(),
    },
  });
}