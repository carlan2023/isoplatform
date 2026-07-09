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

/** Legal entity that owns/operates the site (used in the copyright line). */
export const LEGAL_NAME = "Alrena Group";

/** Primary contact details, surfaced in the footer and contact points. */
export const CONTACT = {
  email: "info@amqualitysystems.com",
  phone: "+256707068533",
  phoneDisplay: "+256 707 068533",
  whatsapp: "https://wa.me/256707068533",
  location: "Kampala, Uganda",
};

/**
 * Social profile URLs. Leave a value as an empty string to hide that icon in
 * the footer (no broken links). Fill in once the profile URLs are confirmed.
 */
export const SOCIALS = {
  linkedin: "",
  youtube: "",
};

/** Build an absolute URL for a path, e.g. abs("/enroll") -> "https://.../enroll". */
export function abs(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
