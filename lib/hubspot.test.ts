import { describe, expect, it } from "vitest";
import { HUBSPOT_CSP_HOSTS, HUBSPOT_SCRIPT_SRC } from "./hubspot";

describe("HubSpot tracking code", () => {
  it("loads the EU1 loader for portal 149517164 over https", () => {
    expect(HUBSPOT_SCRIPT_SRC).toBe(
      "https://js-eu1.hs-scripts.com/149517164.js",
    );
  });

  it("lists the loader host among the CSP hosts", () => {
    expect(HUBSPOT_CSP_HOSTS).toContain(new URL(HUBSPOT_SCRIPT_SRC).origin);
  });
});
