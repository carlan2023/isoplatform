// ---------------------------------------------------------------------------
// Pure helpers for the BroRacks payment webhook.
//
// Kept free of Next.js / Supabase so the security-critical bits (signature
// verification, replay window, amount check) can be unit-tested in isolation.
// ---------------------------------------------------------------------------

import crypto from "node:crypto";

export interface VerifySignatureInput {
  secret: string;
  timestamp: string;
  rawBody: string;
  signature: string; // expected format: "sha256=<hex>"
}

/**
 * Constant-time verification of the BroRacks HMAC signature. Returns false for
 * a missing secret/signature or any mismatch — never throws.
 */
export function verifyWebhookSignature({
  secret,
  timestamp,
  rawBody,
  signature,
}: VerifySignatureInput): boolean {
  if (!secret || !signature) return false;

  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);

  // timingSafeEqual requires equal-length buffers.
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

/**
 * Whether the webhook timestamp is within tolerance of now (default 5 minutes),
 * guarding against replayed deliveries.
 */
export function isFreshTimestamp(
  timestamp: string | number,
  nowSec: number = Date.now() / 1000,
  toleranceSec = 300,
): boolean {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  return Math.abs(nowSec - ts) <= toleranceSec;
}

/**
 * Whether a successful collection should confirm the enrollment. Confirms when
 * the collected amount equals what was owed. If the amount is absent/unknown it
 * cannot be checked, so we allow confirmation (the collection already
 * succeeded). A known mismatch (e.g. underpayment) blocks auto-confirmation.
 */
export function shouldConfirmPayment(
  collectedAmount: unknown,
  expectedAmount: number,
): boolean {
  if (typeof collectedAmount !== "number" || !Number.isFinite(collectedAmount)) {
    return true;
  }
  return collectedAmount === expectedAmount;
}
