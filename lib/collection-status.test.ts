import { describe, expect, it } from "vitest";
import {
  PAYMENT_HOLD_TTL_MS,
  collectionReferenceFrom,
  decideHold,
  parseProviderPaymentState,
  resolveCollectionOutcome,
  webhookReferences,
} from "./collection-status";

describe("resolveCollectionOutcome", () => {
  it("treats failed, cancelled, and expired events as a failure", () => {
    expect(resolveCollectionOutcome("collection.failed")).toBe("failure");
    expect(resolveCollectionOutcome("collection.cancelled")).toBe("failure");
    expect(resolveCollectionOutcome("collection.canceled")).toBe("failure");
    expect(resolveCollectionOutcome("collection.expired")).toBe("failure");
  });

  it("treats a status payload as the outcome when the event name is generic", () => {
    expect(resolveCollectionOutcome("collection.updated", "CANCELLED")).toBe("failure");
    expect(resolveCollectionOutcome("collection.updated", "EXPIRED")).toBe("failure");
    expect(resolveCollectionOutcome("collection.updated", "SUCCEEDED")).toBe("success");
    expect(resolveCollectionOutcome("", "PENDING")).toBe("ignore");
  });

  it("does not treat success as a failure", () => {
    expect(resolveCollectionOutcome("collection.success")).toBe("success");
  });
});

describe("webhookReferences", () => {
  it("collects reference aliases and ignores blanks", () => {
    expect(
      webhookReferences({
        reference: "merchant-1",
        data: { broracks_ref: "BRR-1", reference: "BRR-1", merchant_reference: "" },
      }),
    ).toEqual(["BRR-1", "merchant-1"]);
  });
});

describe("collectionReferenceFrom", () => {
  it("prefers the BRR id and still accepts a plain reference", () => {
    expect(
      collectionReferenceFrom({
        reference: "merchant-1",
        data: { reference: "merchant-1", broracks_ref: "BRR-9" },
      }),
    ).toBe("BRR-9");
    expect(collectionReferenceFrom({ success: true, reference: "ref_1" })).toBe("ref_1");
  });
});

describe("parseProviderPaymentState", () => {
  it("reads a nested transaction status and ignores the success envelope", () => {
    expect(
      parseProviderPaymentState({
        status: "success",
        data: { status: "CANCELLED", amount: 5000, currency: "UGX" },
      }),
    ).toEqual({ state: "failed", amount: 5000, currency: "UGX" });
  });

  it("maps pending, succeeded, failed, and expired", () => {
    expect(parseProviderPaymentState({ data: { status: "PENDING" } }).state).toBe("pending");
    expect(parseProviderPaymentState({ data: { status: "SUCCEEDED" } }).state).toBe("succeeded");
    expect(parseProviderPaymentState({ data: { status: "FAILED" } }).state).toBe("failed");
    expect(parseProviderPaymentState({ data: { status: "EXPIRED" } }).state).toBe("failed");
  });

  it("does not treat a bare envelope as a paid collection", () => {
    expect(parseProviderPaymentState({ status: "success" }).state).toBe("unknown");
  });
});

describe("decideHold", () => {
  const now = Date.parse("2026-10-12T12:00:00.000Z");

  it("releases a provider failure immediately", () => {
    expect(
      decideHold({ state: "failed", heldAtMs: now, nowMs: now, offline: false }),
    ).toBe("release");
  });

  it("confirms a successful collection", () => {
    expect(
      decideHold({ state: "succeeded", heldAtMs: now, nowMs: now, offline: false }),
    ).toBe("confirm");
  });

  it("releases a pending hold once it is 15 minutes old", () => {
    expect(
      decideHold({
        state: "pending",
        heldAtMs: now - PAYMENT_HOLD_TTL_MS + 1,
        nowMs: now,
        offline: false,
      }),
    ).toBe("wait");
    expect(
      decideHold({
        state: "pending",
        heldAtMs: now - PAYMENT_HOLD_TTL_MS,
        nowMs: now,
        offline: false,
      }),
    ).toBe("release");
  });

  it("does not release an offline hold or a hold we could not check", () => {
    expect(
      decideHold({
        state: "failed",
        heldAtMs: now - PAYMENT_HOLD_TTL_MS,
        nowMs: now,
        offline: true,
      }),
    ).toBe("wait");
    expect(
      decideHold({
        state: "unknown",
        heldAtMs: now - PAYMENT_HOLD_TTL_MS,
        nowMs: now,
        offline: false,
      }),
    ).toBe("wait");
  });
});
