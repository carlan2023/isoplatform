// ---------------------------------------------------------------------------
// Post-login redirect sanitiser.
//
// The middleware sends unauthenticated users to /login?redirect=<path>. That
// value is attacker-controllable (anyone can craft a /login link), so before we
// navigate to it we only accept same-origin, relative paths. Anything else
// ("https://evil.com", "//evil.com", "/\evil.com", "javascript:...") falls back
// to a safe default.
// ---------------------------------------------------------------------------

const MAX_REDIRECT_LENGTH = 512;

/**
 * Returns `raw` if it is a safe same-origin relative path (starts with a single
 * "/", no backslashes, no control characters or whitespace, not back to
 * /login), otherwise `fallback`.
 */
export function safeRedirectPath(
  raw: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (typeof raw !== "string") return fallback;
  const value = raw.trim();
  if (!value || value.length > MAX_REDIRECT_LENGTH) return fallback;

  // Must be a rooted path, but not protocol-relative ("//host").
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;

  // Browsers treat "\" like "/" in URLs, so "/\evil.com" is protocol-relative.
  if (value.includes("\\")) return fallback;

  // Control characters / whitespace can be used to smuggle a scheme or host.
  if (/[\u0000-\u001f\u007f\s]/.test(value)) return fallback;

  // Final check: it must resolve to the same origin.
  try {
    const base = "https://same-origin.invalid";
    if (new URL(value, base).origin !== base) return fallback;
  } catch {
    return fallback;
  }

  // Never bounce back to the login page (avoids a redirect loop).
  if (/^\/login(?:[/?#]|$)/.test(value)) return fallback;

  return value;
}
