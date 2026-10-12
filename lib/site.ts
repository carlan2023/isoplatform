// ---------------------------------------------------------------------------
// Site identity — the single source of truth for the canonical public URL.
//
// Used by metadata (canonical + Open Graph), the sitemap, robots.txt, and any
// JSON-LD structured data. Set NEXT_PUBLIC_SITE_URL in the environment to the
// production origin (no trailing slash). The public site is served on www;
// the apex host is a permanent redirect (see next.config.ts). Local builds
// still produce sensible absolute URLs when the variable is unset.
// ---------------------------------------------------------------------------

/** Bare domain. Requests here are permanently redirected to CANONICAL_HOST. */
export const APEX_HOST = "amqualitysystems.com";

/** Host that canonical URLs, the sitemap, and Open Graph should use. */
export const CANONICAL_HOST = "www.amqualitysystems.com";

export const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;

const DEFAULT_SITE_URL = CANONICAL_ORIGIN;

/**
 * Absolute origin (and optional path) for public URLs.
 * The production apex host is rewritten to www so metadata stays canonical
 * even when NEXT_PUBLIC_SITE_URL is still the bare domain. Any other host
 * (preview deployments, local overrides, tests) is left as given.
 */
export function canonicalSiteUrl(raw?: string | null): string {
  const input = (raw ?? "").trim() || DEFAULT_SITE_URL;
  const withProto = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  let url: URL;
  try {
    url = new URL(withProto);
  } catch {
    return DEFAULT_SITE_URL;
  }
  const host = url.hostname.toLowerCase();
  if (host === APEX_HOST || host === CANONICAL_HOST) {
    url.hostname = CANONICAL_HOST;
    url.protocol = "https:";
    url.port = "";
  }
  const path =
    url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
  return `${url.origin}${path}`;
}

export const SITE_URL = canonicalSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export const SITE_NAME = "NAM Quality Management Systems";

/** Legal entity that owns/operates the site (used in the copyright line). */
export const LEGAL_NAME = SITE_NAME;

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
