import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  HUBSPOT_CSP_HOSTS,
  HUBSPOT_SCRIPT_SRC,
  hubSpotPagePath,
  hubSpotPageViewCommands,
} from "./hubspot";

describe("HubSpot tracking code", () => {
  it("loads the EU1 loader for portal 149517164 over https", () => {
    expect(HUBSPOT_SCRIPT_SRC).toBe(
      "https://js-eu1.hs-scripts.com/149517164.js",
    );
  });

  it("lists the loader host among the CSP hosts", () => {
    expect(HUBSPOT_CSP_HOSTS).toContain(new URL(HUBSPOT_SCRIPT_SRC).origin);
  });

  it("keeps the query string on client-side page views", () => {
    expect(hubSpotPagePath("/iso-certification-consulting", "")).toBe(
      "/iso-certification-consulting",
    );
    expect(hubSpotPagePath("/apply", "?standard=iso-9001")).toBe(
      "/apply?standard=iso-9001",
    );
    expect(hubSpotPageViewCommands("/free-consultation")).toEqual([
      ["setPath", "/free-consultation"],
      ["trackPageView"],
    ]);
  });

  it("loads the tracker from the root layout, including after client navigations", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    expect(layout).toContain("HUBSPOT_SCRIPT_SRC");
    expect(layout).toContain("HubSpotPageView");
    expect(layout).toContain('id="hs-script-loader"');
    expect(layout).toContain('strategy="afterInteractive"');
    expect(layout).not.toContain("lazyOnload");
    const consult = readFileSync("app/api/consult/route.ts", "utf8");
    const apply = readFileSync("app/api/apply/route.ts", "utf8");
    expect(consult).toContain("submitHubSpotForm");
    expect(consult).toContain("hubSpotConsultFormId");
    expect(apply).toContain("submitHubSpotForm");
    expect(apply).toContain("hubSpotApplyFormId");
  });
});
