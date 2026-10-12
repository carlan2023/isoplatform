import { describe, expect, it } from "vitest";
import { isCronAuthorized } from "./cron-auth";

describe("isCronAuthorized", () => {
  const secret = "test-cron-secret";

  it("accepts the Bearer token Vercel sends", () => {
    expect(isCronAuthorized(`Bearer ${secret}`, secret)).toBe(true);
  });

  it("rejects a missing header, a missing secret, and a wrong token", () => {
    expect(isCronAuthorized(null, secret)).toBe(false);
    expect(isCronAuthorized(`Bearer ${secret}`, undefined)).toBe(false);
    expect(isCronAuthorized(`Bearer ${secret}`, "")).toBe(false);
    expect(isCronAuthorized("Bearer wrong", secret)).toBe(false);
    expect(isCronAuthorized(secret, secret)).toBe(false);
    expect(isCronAuthorized(`Bearer ${secret} `, secret)).toBe(false);
  });
});
