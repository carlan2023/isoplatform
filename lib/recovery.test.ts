import { describe, expect, it } from "vitest";
import {
  RESET_EMAIL_NOTICE,
  describeRecoveryLink,
  forgotPasswordMessage,
  shouldEstablishRecoveryOnServer,
} from "./recovery";

describe("forgotPasswordMessage", () => {
  it("returns the same notice whether or not Supabase reported an error", () => {
    expect(forgotPasswordMessage()).toBe(RESET_EMAIL_NOTICE);
    expect(forgotPasswordMessage(null)).toBe(RESET_EMAIL_NOTICE);
    expect(forgotPasswordMessage("User not found")).toBe(RESET_EMAIL_NOTICE);
    expect(forgotPasswordMessage("Email rate limit exceeded")).toBe(
      forgotPasswordMessage("User not found"),
    );
    expect(RESET_EMAIL_NOTICE.toLowerCase()).toContain(
      "if an account exists, we've emailed a link",
    );
  });
});

describe("describeRecoveryLink", () => {
  it("recognises a PKCE code and prefers it over a token hash", () => {
    expect(describeRecoveryLink("?code=abc123")).toEqual({
      method: "pkce",
      code: "abc123",
    });
    expect(
      describeRecoveryLink("?code=abc&token_hash=hash&type=recovery"),
    ).toEqual({ method: "pkce", code: "abc" });
  });

  it("recognises a recovery token hash in the query or the hash", () => {
    expect(
      describeRecoveryLink("?token_hash=th_1&type=recovery"),
    ).toEqual({ method: "token_hash", tokenHash: "th_1" });
    expect(describeRecoveryLink("?token_hash=th_2")).toEqual({
      method: "token_hash",
      tokenHash: "th_2",
    });
    expect(describeRecoveryLink("", "#token_hash=th_3&type=recovery")).toEqual(
      { method: "token_hash", tokenHash: "th_3" },
    );
  });

  it("rejects non-recovery token types and provider errors", () => {
    expect(describeRecoveryLink("?token_hash=th&type=signup").method).toBe(
      "reject",
    );
    expect(describeRecoveryLink("?error=access_denied").method).toBe("reject");
    expect(describeRecoveryLink("?error_code=otp_expired").method).toBe(
      "reject",
    );
    expect(
      describeRecoveryLink("", "#error_description=expired").method,
    ).toBe("reject");
    expect(describeRecoveryLink("", "#access_token=tok&type=recovery").method).toBe(
      "reject",
    );
  });

  it("treats a clean URL as an existing-session check", () => {
    expect(describeRecoveryLink("").method).toBe("session");
    expect(describeRecoveryLink("?code=").method).toBe("session");
    expect(describeRecoveryLink("?code=%20%20").method).toBe("session");
  });
});

describe("shouldEstablishRecoveryOnServer", () => {
  it("exchanges PKCE and token-hash links only", () => {
    expect(
      shouldEstablishRecoveryOnServer({ method: "pkce", code: "abc" }),
    ).toBe(true);
    expect(
      shouldEstablishRecoveryOnServer({
        method: "token_hash",
        tokenHash: "th",
      }),
    ).toBe(true);
    expect(shouldEstablishRecoveryOnServer({ method: "reject" })).toBe(false);
    expect(shouldEstablishRecoveryOnServer({ method: "session" })).toBe(false);
  });
});
