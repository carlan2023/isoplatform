// ---------------------------------------------------------------------------
// HubSpot tracking code (portal 149517164, EU1 data centre).
//
// Loaded on every page from the root layout. If a Content-Security-Policy is
// ever added, it must allow HUBSPOT_CSP_HOSTS in script-src and connect-src
// (and img-src/frame-src for the tracking pixel and forms), or tracking breaks.
// ---------------------------------------------------------------------------

export const HUBSPOT_PORTAL_ID = "149517164";

export const HUBSPOT_SCRIPT_SRC = `https://js-eu1.hs-scripts.com/${HUBSPOT_PORTAL_ID}.js`;

export const HUBSPOT_CSP_HOSTS = [
  "https://js-eu1.hs-scripts.com",
  "https://js-eu1.hs-analytics.net",
  "https://js-eu1.hs-banner.com",
  "https://js-eu1.hscollectedforms.net",
  "https://forms-eu1.hscollectedforms.net",
  "https://track-eu1.hubspot.com",
  "https://*.hubspot.com",
] as const;
