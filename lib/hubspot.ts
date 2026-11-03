// ---------------------------------------------------------------------------
// HubSpot tracking code (portal 149517164, EU1 data centre).
//
// Loaded on every page from the root layout. The privacy policy tells visitors
// that HubSpot analytics cookies are in use and that they can refuse cookies
// in the browser. There is no on-site consent banner, so the script is not
// gated. If a banner is added later, both the script and trackHubSpotPageView
// must sit behind the same choice.
//
// The loader records the first full page load itself. Client-side route
// changes (Next.js <Link>) do not reload the document, so those views are
// pushed onto window._hsq from HubSpotPageView. Load the script with
// afterInteractive rather than lazyOnload: idle loading misses short visits,
// which is most of the homepage traffic.
//
// If a Content-Security-Policy is ever added, it must allow HUBSPOT_CSP_HOSTS
// in script-src and connect-src (and img-src/frame-src for the tracking pixel
// and forms), or tracking breaks.
// ---------------------------------------------------------------------------

export const HUBSPOT_PORTAL_ID = "149517164";

export const HUBSPOT_SCRIPT_SRC = `https://js-eu1.hs-scripts.com/${HUBSPOT_PORTAL_ID}.js`;

/** Path HubSpot should record, including the query string when present. */
export function hubSpotPagePath(pathname: string, search = ""): string {
  const query = search.replace(/^\?/, "").trim();
  return query ? `${pathname}?${query}` : pathname || "/";
}

/** Commands the SPA tracker queues after the first load. */
export function hubSpotPageViewCommands(path: string): unknown[][] {
  return [["setPath", path], ["trackPageView"]];
}

export const HUBSPOT_CSP_HOSTS = [
  "https://js-eu1.hs-scripts.com",
  "https://js-eu1.hs-analytics.net",
  "https://js-eu1.hs-banner.com",
  "https://js-eu1.hscollectedforms.net",
  "https://forms-eu1.hscollectedforms.net",
  "https://track-eu1.hubspot.com",
  "https://*.hubspot.com",
] as const;
