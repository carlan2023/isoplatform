import { describe, expect, it } from "vitest";
import {
  APEX_HOST,
  CANONICAL_HOST,
  CANONICAL_ORIGIN,
  canonicalSiteUrl,
} from "./site";

describe("canonicalSiteUrl", () => {
  it("defaults to the www origin", () => {
    expect(canonicalSiteUrl(undefined)).toBe(CANONICAL_ORIGIN);
    expect(canonicalSiteUrl("")).toBe(CANONICAL_ORIGIN);
    expect(canonicalSiteUrl("   ")).toBe(CANONICAL_ORIGIN);
    expect(CANONICAL_HOST).toBe(`www.${APEX_HOST}`);
  });

  it("rewrites the apex host to www", () => {
    expect(canonicalSiteUrl("https://amqualitysystems.com")).toBe(
      "https://www.amqualitysystems.com",
    );
    expect(canonicalSiteUrl("https://amqualitysystems.com/")).toBe(
      "https://www.amqualitysystems.com",
    );
    expect(canonicalSiteUrl("http://AMQUALITYSYSTEMS.com/courses")).toBe(
      "https://www.amqualitysystems.com/courses",
    );
  });

  it("keeps www and non-production hosts", () => {
    expect(canonicalSiteUrl("https://www.amqualitysystems.com/")).toBe(
      "https://www.amqualitysystems.com",
    );
    expect(canonicalSiteUrl("https://example.com/")).toBe("https://example.com");
    expect(
      canonicalSiteUrl("https://iso-platform-abc.vercel.app"),
    ).toBe("https://iso-platform-abc.vercel.app");
  });
});
