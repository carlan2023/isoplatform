import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CANONICAL_BASE_URL,
  forgotPasswordHref,
  publicBaseUrl,
  resetPasswordRedirectTo,
} from "./auth-url";

describe("publicBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to the canonical www origin", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    expect(publicBaseUrl()).toBe(CANONICAL_BASE_URL);
    expect(resetPasswordRedirectTo()).toBe(
      "https://www.amqualitysystems.com/reset-password",
    );
  });

  it("uses NEXT_PUBLIC_BASE_URL and strips trailing slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://preview.example.com///");
    expect(publicBaseUrl()).toBe("https://preview.example.com");
    expect(resetPasswordRedirectTo()).toBe(
      "https://preview.example.com/reset-password",
    );
  });

  it("trims surrounding whitespace", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "  http://localhost:3000/  ");
    expect(resetPasswordRedirectTo()).toBe(
      "http://localhost:3000/reset-password",
    );
  });
});

describe("forgotPasswordHref", () => {
  it("links to the forgot-password page", () => {
    expect(forgotPasswordHref("")).toBe("/forgot-password");
    expect(forgotPasswordHref("not-an-email")).toBe("/forgot-password");
  });

  it("prefills a valid email", () => {
    expect(forgotPasswordHref("  ada@example.com ")).toBe(
      "/forgot-password?email=ada%40example.com",
    );
    expect(forgotPasswordHref("a+b@example.com")).toBe(
      "/forgot-password?email=a%2Bb%40example.com",
    );
  });
});
