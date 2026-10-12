// ---------------------------------------------------------------------------
// Pure BroRacks collection status / webhook classification.
//
// Docs (https://broracks.online/docs):
//   GET  /v1/collections/{reference}
//   GET  /v1/transactions/{reference}
//   POST /v1/transactions/{broracks_ref}/check-status
// Transaction status values include PENDING, SUCCEEDED, FAILED, EXPIRED.
// Cancelled USSD prompts are treated as a failed collection too.
// ---------------------------------------------------------------------------

export const PAYMENT_HOLD_TTL_MS = 15 * 60 * 1000;

export type ProviderPaymentState = "pending" | "succeeded" | "failed" | "unknown";

export type HoldAction = "confirm" | "release" | "wait";

const SUCCESS_TOKENS = new Set([
  "SUCCEEDED",
  "SUCCESSFUL",
  "COMPLETED",
  "PAID",
  "SUCCESS",
]);

const FAILURE_TOKENS = new Set([
  "FAILED",
  "FAILURE",
  "CANCELLED",
  "CANCELED",
  "EXPIRED",
  "DECLINED",
  "REJECTED",
]);

const PENDING_TOKENS = new Set(["PENDING", "PROCESSING", "INITIATED", "IN_PROGRESS"]);

/** API envelope words. These are not a payment outcome. */
const ENVELOPE_TOKENS = new Set(["SUCCESS", "OK", "ERROR"]);

const FAILURE_EVENTS = new Set([
  "collection.failed",
  "collection.failure",
  "collection.cancelled",
  "collection.canceled",
  "collection.expired",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringField(record: Record<string, unknown> | null, key: string): string | null {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function classifyToken(token: string, allowEnvelopeSuccess: boolean): ProviderPaymentState | null {
  const upper = token.trim().toUpperCase();
  if (!upper) return null;
  if (!allowEnvelopeSuccess && ENVELOPE_TOKENS.has(upper)) return null;
  if (FAILURE_TOKENS.has(upper)) return "failed";
  if (PENDING_TOKENS.has(upper)) return "pending";
  if (SUCCESS_TOKENS.has(upper)) return "succeeded";
  return null;
}

/**
 * Read a payment outcome from a BroRacks status body.
 * Nested `data.status` wins. A bare envelope `status: "success"` is not a payment.
 */
export function parseProviderPaymentState(body: unknown): {
  state: ProviderPaymentState;
  amount: number | null;
  currency: string | null;
} {
  const root = asRecord(body);
  const data = asRecord(root?.data) ?? asRecord(root?.transaction);
  const nested =
    stringField(data, "status") ??
    stringField(data, "state") ??
    stringField(data, "transaction_status");
  const top = stringField(root, "status") ?? stringField(root, "state");

  const state =
    (nested ? classifyToken(nested, true) : null) ??
    (top ? classifyToken(top, false) : null) ??
    "unknown";

  const amountSource = data?.amount ?? root?.amount;
  const amount =
    typeof amountSource === "number" && Number.isFinite(amountSource)
      ? amountSource
      : typeof amountSource === "string" && /^\d+(\.\d+)?$/.test(amountSource.trim())
        ? Number(amountSource)
        : null;
  const currency =
    stringField(data, "currency") ?? stringField(root, "currency");

  return { state, amount, currency };
}

/**
 * Map a webhook event name (body `event` / `type`, or X-BroRacks-Event) and an
 * optional transaction status onto success, failure, or ignore.
 */
export function resolveCollectionOutcome(
  eventName: string | null | undefined,
  dataStatus?: unknown,
): "success" | "failure" | "ignore" {
  const name = (eventName ?? "").trim().toLowerCase();
  if (name === "collection.success" || name === "collection.succeeded") {
    return "success";
  }
  if (FAILURE_EVENTS.has(name)) return "failure";

  const status = typeof dataStatus === "string" ? dataStatus : "";
  const fromStatus = status ? classifyToken(status, true) : null;
  if (fromStatus === "succeeded") return "success";
  if (fromStatus === "failed") return "failure";
  return "ignore";
}

/** Every payment reference a webhook might use to point at our enrollment. */
export function webhookReferences(event: unknown): string[] {
  const root = asRecord(event);
  const data = asRecord(root?.data);
  const keys = ["reference", "broracks_ref", "merchant_reference", "transaction_reference"];
  const found: string[] = [];
  for (const source of [data, root]) {
    if (!source) continue;
    for (const key of keys) {
      const value = stringField(source, key);
      if (value) found.push(value);
    }
  }
  return [...new Set(found)];
}

/** Reference to store after collections/initiate. Prefer the BRR-* id webhooks and status checks use. */
export function collectionReferenceFrom(body: unknown): string | null {
  const root = asRecord(body);
  const data = asRecord(root?.data);
  const candidates = [
    stringField(data, "broracks_ref"),
    stringField(root, "broracks_ref"),
    stringField(data, "reference"),
    stringField(root, "reference"),
  ].filter((value): value is string => !!value);
  return candidates.find((value) => value.startsWith("BRR-")) ?? candidates[0] ?? null;
}

/**
 * What to do with a held seat given the provider state and how long it has
 * been held. Offline/cash holds are never released here. A provider outage
 * (`unknown`) does not release a seat that might already have been paid.
 */
export function decideHold(input: {
  state: ProviderPaymentState;
  heldAtMs: number | null;
  nowMs: number;
  offline: boolean;
  ttlMs?: number;
}): HoldAction {
  if (input.offline) return "wait";
  if (input.state === "succeeded") return "confirm";
  if (input.state === "failed") return "release";
  const ttl = input.ttlMs ?? PAYMENT_HOLD_TTL_MS;
  if (
    input.state === "pending" &&
    input.heldAtMs !== null &&
    input.nowMs - input.heldAtMs >= ttl
  ) {
    return "release";
  }
  return "wait";
}
