import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import {
  verifyWebhookSignature,
  isFreshTimestamp,
  shouldConfirmPayment,
} from "./webhook";

const secret = "whsec_test_secret";
const timestamp = "1700000000";
const rawBody = JSON.stringify({ event: "collection.success", data: {} });

function sign(s: string, ts: string, body: string): string {
  return (
    "sha256=" +
    crypto.createHmac("sha256", s).update(`${ts}.${body}`).digest("hex")
  );
}

describe("verifyWebhookSignature", () => {
  it("accepts a correctly signed payload", () => {
    expect(
      verifyWebhookSignature({
        secret,
        timestamp,
        rawBody,
        signature: sign(secret, timestamp, rawBody),
      }),
    ).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(
      verifyWebhookSignature({
        secret,
        timestamp,
        rawBody: rawBody + "tampered",
        signature: sign(secret, timestamp, rawBody),
      }),
    ).toBe(false);
  });

  it("rejects a signature made with the wrong secret", () => {
    expect(
      verifyWebhookSignature({
        secret,
        timestamp,
        rawBody,
        signature: sign("wrong_secret", timestamp, rawBody),
      }),
    ).toBe(false);
  });

  it("rejects an empty signature", () => {
    expect(
      verifyWebhookSignature({ secret, timestamp, rawBody, signature: "" }),
    ).toBe(false);
  });
});

describe("isFreshTimestamp", () => {
  const now = 1_700_000_000;

  it("accepts a timestamp within the tolerance", () => {
    expect(isFreshTimestamp(now - 100, now)).toBe(true);
    expect(isFreshTimestamp(now + 100, now)).toBe(true);
  });

  it("rejects a stale timestamp", () => {
    expect(isFreshTimestamp(now - 600, now)).toBe(false);
  });

  it("rejects a non-numeric timestamp", () => {
    expect(isFreshTimestamp("", now)).toBe(false);
  });
});

describe("shouldConfirmPayment", () => {
  it("confirms when the collected amount matches", () => {
    expect(shouldConfirmPayment(300_000, 300_000)).toBe(true);
  });

  it("does not confirm on an underpayment", () => {
    expect(shouldConfirmPayment(100_000, 300_000)).toBe(false);
  });

  it("confirms when the amount is unknown (cannot be checked)", () => {
    expect(shouldConfirmPayment(undefined, 300_000)).toBe(true);
  });
});
