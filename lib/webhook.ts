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
 * Verify against any of several secrets (current + previous during an account
 * or secret rotation). Secrets are trimmed; blank/missing ones are skipped.
 */
export function verifyWebhookSignatureAny({
  secrets,
  ...rest
}: Omit<VerifySignatureInput, "secret"> & {
  secrets: (string | null | undefined)[];
}): boolean {
  return secrets.some((s) => {
    const secret = s?.trim();
    return !!secret && verifyWebhookSignature({ secret, ...rest });
  });
}

/**
 * The webhook secrets to accept: BRORACKS_WEBHOOK_SECRET, plus the optional
 * BRORACKS_WEBHOOK_SECRET_PREVIOUS so deliveries for payments started on the
 * old account still verify during a cutover. Trimmed; blanks dropped.
 */
export function getWebhookSecrets(
  env: Record<string, string | undefined> = process.env,
): string[] {
  return [env.BRORACKS_WEBHOOK_SECRET, env.BRORACKS_WEBHOOK_SECRET_PREVIOUS]
    .map((s) => s?.trim() ?? "")
    .filter(Boolean);
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
 * Coerce a provider-reported amount to a number. Providers sometimes send
 * amounts as numeric strings ("300000" / "300000.00"). Returns null when the
 * value is absent or not a finite number.
 */
export function parseAmount(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && /^\s*\d+(\.\d+)?\s*$/.test(value)) {
    return Number(value);
  }
  return null;
}

/** The only currency courses are priced and charged in. */
export const EXPECTED_CURRENCY = "UGX";

/**
 * Whether a successful collection should confirm the enrollment. Confirms when
 * the collected amount equals what was owed (the server-computed amount stored
 * on the enrollment at reservation time — never a client-sent value). If the
 * amount is absent it cannot be checked, so we allow confirmation (the
 * collection already succeeded). A known mismatch (e.g. underpayment), an
 * unparseable amount, or a currency other than UGX blocks auto-confirmation.
 */
export function shouldConfirmPayment(
  collectedAmount: unknown,
  expectedAmount: number,
  currency?: unknown,
): boolean {
  if (
    currency !== undefined &&
    currency !== null &&
    String(currency).trim().toUpperCase() !== EXPECTED_CURRENCY
  ) {
    return false;
  }
  if (collectedAmount === undefined || collectedAmount === null) return true;
  const collected = parseAmount(collectedAmount);
  if (collected === null) return false;
  return Math.round(collected) === Math.round(Number(expectedAmount));
}

/** Webhook event types that mean the Mobile Money collection did not happen. */
export const FAILED_COLLECTION_EVENTS = new Set([
  "collection.failed",
  "collection.cancelled",
  "collection.expired",
]);
