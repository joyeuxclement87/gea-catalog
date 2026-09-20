import { NextRequest, NextResponse } from "next/server";

/**
 * Image uploads are capped at 4 MB — safely under the platform request-body
 * limits (e.g. Vercel's ~4.5 MB cap), so a file that is too large is rejected
 * by our route with a clean JSON 413 instead of being cut off by the platform
 * with an empty response body.
 */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * Fast-fail for oversized uploads, checked before the multipart body is read.
 * Returns a JSON 413 response when the request advertises a Content-Length
 * above the cap, otherwise null. The per-file size check in each route remains
 * as the authoritative fallback (Content-Length can be absent).
 */
export function rejectOversizedUpload(request: NextRequest, maxBytes = MAX_IMAGE_BYTES): NextResponse | null {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    return NextResponse.json(
      { error: `Images must be ${Math.round(maxBytes / (1024 * 1024))} MB or smaller.` },
      { status: 413 },
    );
  }
  return null;
}