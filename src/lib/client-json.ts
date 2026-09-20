/**
 * Reads a fetch Response body as JSON without throwing the raw
 * "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
 * TypeError that browsers throw when the body is empty (common when a server
 * or platform rejects a request before the route handler runs — e.g. oversized
 * uploads that Vercel answers with an empty 4xx/5xx body).
 *
 * Returns `null` for an empty body. Throws a clear Error (with the HTTP status)
 * when the body is present but not valid JSON.
 */
export async function parseJsonResponse<T = unknown>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      response.ok
        ? "The server returned an unreadable response."
        : `Request failed (HTTP ${response.status}).`,
    );
  }
}