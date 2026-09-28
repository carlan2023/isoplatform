import { describe, it, expect } from "vitest";
import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it("accepts same-origin relative paths (with query and hash)", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/enroll/abc-123")).toBe("/enroll/abc-123");
    expect(safeRedirectPath("/admin?tab=pending#top")).toBe(
      "/admin?tab=pending#top",
    );
  });

  it("falls back for missing/empty values", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath("")).toBe("/dashboard");
    expect(safeRedirectPath("   ", "/home")).toBe("/home");
  });

  it("rejects absolute and protocol-relative URLs (open redirect)", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("//evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("///evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("/\\evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("\\\\evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/dashboard");
    expect(safeRedirectPath("dashboard")).toBe("/dashboard");
  });

  it("rejects control characters and embedded whitespace", () => {
    expect(safeRedirectPath("/\t/evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("/\n/evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("/foo bar")).toBe("/dashboard");
  });

  it("does not redirect back to the login page", () => {
    expect(safeRedirectPath("/login")).toBe("/dashboard");
    expect(safeRedirectPath("/login?redirect=/admin")).toBe("/dashboard");
    // …but a path that merely starts with the same letters is fine.
    expect(safeRedirectPath("/login-help")).toBe("/login-help");
  });

  it("rejects overly long values", () => {
    expect(safeRedirectPath("/" + "a".repeat(600))).toBe("/dashboard");
  });
});
