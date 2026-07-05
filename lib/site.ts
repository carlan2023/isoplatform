// ---------------------------------------------------------------------------
// Site identity — the single source of truth for the canonical public URL.
//
// Used by metadata (canonical + Open Graph), the sitemap, robots.txt, and any
// JSON-LD structured data. Set NEXT_PUBLIC_SITE_URL in the environment to the
// production origin (no trailing slash). Falls back to the primary domain so
// local builds still produce sensible absolute URLs.
// ---------------------------------------------------------------------------

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://amqualitysystems.com"
).replace(/\/$/, "");

export const SITE_NAME = "AM Quality Management Systems";

/** Build an absolute URL for a path, e.g. abs("/enroll") -> "https://.../enroll". */
export function abs(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
