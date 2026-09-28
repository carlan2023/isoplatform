// ---------------------------------------------------------------------------
// Small request-validation helpers shared by the API routes.
// ---------------------------------------------------------------------------

// Pragmatic email check: one "@", no spaces, a dot in the domain part. The
// real verification is the email actually being delivered.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MAX_EMAIL_LENGTH = 254;

export function isValidEmail(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const v = value.trim();
  return v.length <= MAX_EMAIL_LENGTH && EMAIL_RE.test(v);
}

/**
 * Returns the trimmed string if `value` is a string no longer than `max`,
 * `""` for null/undefined, or null if it is the wrong type or too long.
 */
export function cleanString(value: unknown, max: number): string | null {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > max ? null : trimmed;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Parse a JSON request body; returns null on invalid JSON or a non-object. */
export async function readJsonObject(
  req: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}
