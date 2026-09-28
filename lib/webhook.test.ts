import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import {
  verifyWebhookSignature,
  isFreshTimestamp,
  shouldConfirmPayment,
  parseAmount,
  FAILED_COLLECTION_EVENTS,
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
    expect(shouldConfirmPayment(null, 300_000)).toBe(true);
  });

  it("does not confirm on an overpayment", () => {
    expect(shouldConfirmPayment(1_300_000, 300_000)).toBe(false);
  });

  it("accepts numeric-string amounts from the provider", () => {
    expect(shouldConfirmPayment("300000", 300_000)).toBe(true);
    expect(shouldConfirmPayment("300000.00", 300_000)).toBe(true);
    expect(shouldConfirmPayment("100000", 300_000)).toBe(false);
  });

  it("does not confirm an unparseable amount", () => {
    expect(shouldConfirmPayment("three hundred", 300_000)).toBe(false);
    expect(shouldConfirmPayment(Number.NaN, 300_000)).toBe(false);
    expect(shouldConfirmPayment({}, 300_000)).toBe(false);
  });

  it("checks the currency when the provider sends one", () => {
    expect(shouldConfirmPayment(300_000, 300_000, "UGX")).toBe(true);
    expect(shouldConfirmPayment(300_000, 300_000, "ugx")).toBe(true);
    expect(shouldConfirmPayment(300_000, 300_000, "USD")).toBe(false);
    expect(shouldConfirmPayment(300_000, 300_000, undefined)).toBe(true);
  });
});

describe("parseAmount", () => {
  it("parses numbers and numeric strings, rejects the rest", () => {
    expect(parseAmount(5)).toBe(5);
    expect(parseAmount(" 42 ")).toBe(42);
    expect(parseAmount("1.5")).toBe(1.5);
    expect(parseAmount("-5")).toBeNull();
    expect(parseAmount("1e6")).toBeNull();
    expect(parseAmount(Infinity)).toBeNull();
    expect(parseAmount(undefined)).toBeNull();
  });
});

describe("FAILED_COLLECTION_EVENTS", () => {
  it("covers failed/cancelled/expired but not success", () => {
    expect(FAILED_COLLECTION_EVENTS.has("collection.failed")).toBe(true);
    expect(FAILED_COLLECTION_EVENTS.has("collection.cancelled")).toBe(true);
    expect(FAILED_COLLECTION_EVENTS.has("collection.expired")).toBe(true);
    expect(FAILED_COLLECTION_EVENTS.has("collection.success")).toBe(false);
  });
});

describe("verifyWebhookSignature — edge cases", () => {
  it("rejects when the secret is empty", () => {
    expect(
      verifyWebhookSignature({
        secret: "",
        timestamp,
        rawBody,
        signature: sign("", timestamp, rawBody),
      }),
    ).toBe(false);
  });

  it("rejects a signature over a different timestamp (replay with new ts)", () => {
    expect(
      verifyWebhookSignature({
        secret,
        timestamp: "1700000999",
        rawBody,
        signature: sign(secret, timestamp, rawBody),
      }),
    ).toBe(false);
  });

  it("rejects a truncated signature without throwing", () => {
    const sig = sign(secret, timestamp, rawBody).slice(0, 20);
    expect(
      verifyWebhookSignature({ secret, timestamp, rawBody, signature: sig }),
    ).toBe(false);
  });

  it("rejects a multi-byte signature of equal JS length without throwing", () => {
    const good = sign(secret, timestamp, rawBody);
    const weird = "é".repeat(good.length);
    expect(
      verifyWebhookSignature({ secret, timestamp, rawBody, signature: weird }),
    ).toBe(false);
  });
});
