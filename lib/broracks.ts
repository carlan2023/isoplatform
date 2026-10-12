// ---------------------------------------------------------------------------
// BroRacks — Mobile Money payment integration (MTN & Airtel Uganda)
//
// Responsibilities:
//   1. getSessionToken()      — authenticates and caches the bearer token
//   2. initiateCollection()   — sends a Mobile Money prompt to a payer's phone
//   3. verifyPhone()          — checks if a number is a valid Mobile Money number
//   4. checkBroRacksAuth()    — admin health check: can we get a token?
//
// Every request to the provider has a hard timeout so a hung BroRacks API can
// never hold a serverless function (and the learner's spinner) open
// indefinitely.
// ---------------------------------------------------------------------------

import {
  collectionReferenceFrom,
  parseProviderPaymentState,
  type ProviderPaymentState,
} from "./collection-status";

const DEFAULT_API_URL = "https://api.broracks.online";

/** API origin. BRORACKS_API_URL overrides it; read per call, not at load. */
export function getBroRacksApiUrl(): string {
  return (process.env.BRORACKS_API_URL?.trim() || DEFAULT_API_URL).replace(
    /\/+$/,
    "",
  );
}

/** Keys, trimmed — values pasted into Vercel often carry stray whitespace. */
function getCredentials(): { publicKey: string; secretKey: string } {
  return {
    publicKey: process.env.BRORACKS_PUBLIC_KEY?.trim() ?? "",
    secretKey: process.env.BRORACKS_SECRET_KEY?.trim() ?? "",
  };
}

// Serverless functions on Vercel default to a 10–60s budget; stay well inside.
const AUTH_TIMEOUT_MS = 10_000;
const REQUEST_TIMEOUT_MS = 20_000;

/** fetch() with an AbortController-backed timeout. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function isAbortError(e: unknown): boolean {
  return e instanceof Error && e.name === "AbortError";
}

// ---------------------------------------------------------------------------
// Token cache — avoids a fresh auth round-trip on every payment request.
// BroRacks session tokens expire after 5 minutes. Never reuse one for longer
// than 4 minutes, and only for the public key it was issued to, so a key
// change in a warm lambda never reuses a token from the old account.
// ---------------------------------------------------------------------------
/** Hard cap. BroRacks tokens last 5 minutes; drop ours a minute early. */
const TOKEN_CACHE_MAX_MS = 4 * 60 * 1000;

let cachedToken: string | null = null;
let cachedTokenKey: string | null = null; // public key the token belongs to
let tokenExpiresAt: number = 0; // Unix timestamp in milliseconds

export function clearTokenCache() {
  cachedToken = null;
  cachedTokenKey = null;
  tokenExpiresAt = 0;
}

/** Thrown when BroRacks rejects our credentials (carries the HTTP status). */
export class BroRacksAuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null = null,
    readonly providerMessage: string | null = null,
  ) {
    super(message);
    this.name = "BroRacksAuthError";
  }
}

/**
 * How long a freshly issued token may stay in cache. Never more than 4
 * minutes, and sooner when the response names an earlier expiry.
 */
function tokenCacheMs(payload: unknown, now: number): number {
  let ms = TOKEN_CACHE_MAX_MS;
  const data =
    payload && typeof payload === "object"
      ? (payload as { data?: unknown }).data
      : null;
  if (!data || typeof data !== "object") return ms;

  const record = data as Record<string, unknown>;
  const expiresIn = record.expires_in;
  if (typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0) {
    ms = Math.min(ms, Math.floor(expiresIn * 1000));
  }

  const expiresAt = record.expires_at ?? record.expiry;
  if (typeof expiresAt === "number" && Number.isFinite(expiresAt)) {
    const absolute = expiresAt > 1e12 ? expiresAt : expiresAt * 1000;
    ms = Math.min(ms, absolute - now);
  } else if (typeof expiresAt === "string") {
    const absolute = Date.parse(expiresAt);
    if (!Number.isNaN(absolute)) ms = Math.min(ms, absolute - now);
  }

  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return ms;
}

async function getSessionToken(): Promise<string> {
  const now = Date.now();
  const { publicKey, secretKey } = getCredentials();

  // Return cached token if it's still valid for the current key.
  if (cachedToken && cachedTokenKey === publicKey && now < tokenExpiresAt) {
    return cachedToken;
  }

  if (!publicKey || !secretKey) {
    console.error(
      "[broracks] BRORACKS_PUBLIC_KEY / BRORACKS_SECRET_KEY not configured",
    );
    throw new Error("BroRacks is not configured");
  }

  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${getBroRacksApiUrl()}/v1/auth/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_key: publicKey, secret_key: secretKey }),
      },
      AUTH_TIMEOUT_MS,
    );
  } catch (e) {
    // Network-level failure (DNS, timeout, connection refused).
    console.error(
      `[broracks] auth request ${isAbortError(e) ? "timed out" : "network error"}:`,
      e,
    );
    throw new Error("Could not reach BroRacks to authenticate");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const info = broRacksErrorDetails(body);
    // Code and message only — the raw body can echo keys.
    console.error(
      `[broracks] auth failed: status=${res.status} code=${info.code ?? "none"} message=${info.message ?? "none"}`,
    );
    clearTokenCache();
    throw new BroRacksAuthError(
      `BroRacks auth failed (${res.status})`,
      res.status,
      info.code,
      info.message,
    );
  }

  const data = await res.json().catch(() => null);

  if (!data?.data?.token) {
    // Don't log the full body: it may echo credentials.
    console.error("[broracks] auth response missing token");
    throw new Error("BroRacks auth response did not include a token");
  }

  const issuedAt = Date.now();
  cachedToken = data.data.token as string;
  cachedTokenKey = publicKey;
  tokenExpiresAt = issuedAt + tokenCacheMs(data, issuedAt);

  return cachedToken;
}

export interface AuthCheckResult {
  ok: boolean;
  status?: number;
  /** BroRacks error code, e.g. INVALID_CREDENTIALS. Never a secret. */
  code?: string;
  error?: string;
}

/**
 * Admin health check: performs a fresh token request with the configured
 * keys. Never returns the token or the keys — only whether it worked.
 */
export async function checkBroRacksAuth(): Promise<AuthCheckResult> {
  clearTokenCache();
  try {
    await getSessionToken();
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      ...(e instanceof BroRacksAuthError
        ? { status: e.status, ...(e.code ? { code: e.code } : {}) }
        : {}),
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export interface BroRacksHealth {
  configured: {
    publicKey: boolean;
    secretKey: boolean;
    webhookSecret: boolean;
    previousWebhookSecret: boolean;
  };
  apiUrl: string;
  auth: AuthCheckResult;
  webhookUrl?: string;
}

/**
 * Connection report for GET /api/admin/payments/health. Reports only whether
 * each value is set — never the values themselves.
 */
export async function getBroRacksHealth(): Promise<BroRacksHealth> {
  const { publicKey, secretKey } = getCredentials();
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  return {
    configured: {
      publicKey: !!publicKey,
      secretKey: !!secretKey,
      webhookSecret: !!process.env.BRORACKS_WEBHOOK_SECRET?.trim(),
      previousWebhookSecret:
        !!process.env.BRORACKS_WEBHOOK_SECRET_PREVIOUS?.trim(),
    },
    apiUrl: getBroRacksApiUrl(),
    auth: await checkBroRacksAuth(),
    ...(site ? { webhookUrl: `${site}/api/webhooks/broracks` } : {}),
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CollectionParams {
  payerName: string;
  phoneNumber: string; // Must be in international format e.g. +256771234567
  amount: number; // In UGX
  description: string;
  idempotencyKey: string; // Unique per transaction — prevents double charges
}

export interface CollectionResult {
  success: boolean;
  reference: string; // Store this in the enrollment to match webhook events
  message?: string;
}

/**
 * Thrown when the provider did not answer in time. The prompt MAY still have
 * been sent, so callers should tell the learner to check their phone / wait
 * rather than retry immediately.
 */
export class BroRacksTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BroRacksTimeoutError";
  }
}

/**
 * Thrown when BroRacks answered but refused the collection (bad number,
 * unsupported network, limits, auth/config problems…). `providerMessage` is
 * BroRacks' own explanation, safe to show the learner.
 */
export class BroRacksRejectedError extends Error {
  constructor(
    message: string,
    readonly providerMessage: string | null,
    readonly status: number | null,
    readonly code: string | null = null,
  ) {
    super(message);
    this.name = "BroRacksRejectedError";
  }
}

/** Pull a human-readable message out of a BroRacks JSON/text error body. */
export function providerMessageFrom(body: unknown): string | null {
  let parsed: unknown = body;
  if (typeof body === "string") {
    try {
      parsed = JSON.parse(body);
    } catch {
      parsed = body;
    }
  }
  const pick = (v: unknown): string | null =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : null;
  if (typeof parsed === "string") {
    // Plain text only — never echo an HTML error page.
    return /<[a-z!]/i.test(parsed) ? null : pick(parsed);
  }
  if (parsed && typeof parsed === "object") {
    const o = parsed as Record<string, unknown>;
    const nested = (o.error ?? o.data) as Record<string, unknown> | string | undefined;
    return (
      pick(o.message) ??
      pick(typeof nested === "string" ? nested : nested?.message) ??
      pick(o.detail) ??
      null
    );
  }
  return null;
}

/** Strip values that must never land in logs or in a message shown to a learner. */
function redactSecrets(value: string): string {
  return value
    .replace(/\b(?:pk|sk)_(?:test|live)_[A-Za-z0-9_-]+/gi, "[redacted]")
    .replace(
      /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
      "[redacted]",
    )
    .slice(0, 200);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function sanitizeCode(code: string | null): string | null {
  if (!code) return null;
  const cleaned = code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
  return cleaned || null;
}

function extractErrorCode(parsed: unknown): string | null {
  const record = asRecord(parsed);
  if (!record) return null;
  const direct =
    (typeof asRecord(record.error)?.code === "string"
      ? (asRecord(record.error)?.code as string)
      : null) ?? (typeof record.code === "string" ? record.code : null);
  if (direct) return direct;
  const detail = asRecord(record.detail);
  if (detail) {
    const nested =
      (typeof asRecord(detail.error)?.code === "string"
        ? (asRecord(detail.error)?.code as string)
        : null) ?? (typeof detail.code === "string" ? detail.code : null);
    if (nested) return nested;
  }
  if (typeof record.type === "string") {
    const slug = record.type.split("/").filter(Boolean).pop() ?? "";
    if (/^[a-z0-9_]+$/i.test(slug)) return slug;
  }
  return null;
}

/**
 * Error code and human message from a BroRacks body. Secrets are removed.
 * The raw body is not returned — auth failures can echo key material.
 */
export function broRacksErrorDetails(body: unknown): {
  code: string | null;
  message: string | null;
} {
  let parsed: unknown = body;
  if (typeof body === "string") {
    const trimmed = body.trim();
    if (!trimmed) return { code: null, message: null };
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      parsed = body;
    }
  }
  const message = providerMessageFrom(parsed);
  return {
    code: sanitizeCode(extractErrorCode(parsed)),
    message: message ? redactSecrets(message) : null,
  };
}

export const PAYMENTS_UNAVAILABLE_MESSAGE =
  "Payments are temporarily unavailable, please try again later or contact us";

const COLLECTION_TIMEOUT_MESSAGE =
  "Mobile Money is taking too long to respond. If a payment prompt still reaches your phone, please decline it — then try again or pay by cash / bank transfer.";

/** True only when BroRacks (or we) rejected the phone number itself. */
export function isMomoNumberFailure(error: unknown): boolean {
  if (!(error instanceof BroRacksRejectedError)) return false;
  if (error.status === 401 || error.status === 403 || error.status === 429) {
    return false;
  }
  if (error.status !== null && error.status >= 500) return false;
  const code = (error.code ?? "").toUpperCase();
  if (code === "INVALID_CREDENTIALS" || code === "UNAUTHORIZED") return false;
  if (/PHONE|MSISDN|NETWORK/.test(code)) return true;
  const message = (error.providerMessage ?? "").toLowerCase();
  return (
    /\b(phone|msisdn|unsupported network|invalid number)\b/.test(message) ||
    message.includes("mobile number")
  );
}

/** Learner-facing copy for a failed collection. Auth and server faults never blame the number. */
export function userMessageForCollectionFailure(error: unknown): string {
  if (error instanceof BroRacksTimeoutError) return COLLECTION_TIMEOUT_MESSAGE;
  if (error instanceof BroRacksRejectedError && isMomoNumberFailure(error)) {
    return error.providerMessage
      ? `Mobile Money couldn't start the payment: ${error.providerMessage}. Check the number and try again, or pay by cash / bank transfer.`
      : "Check the number and try again, or pay by cash / bank transfer.";
  }
  return PAYMENTS_UNAVAILABLE_MESSAGE;
}

/** Safe fields for server logs. Does not include response bodies or credentials. */
export function describeBroRacksFailure(error: unknown): {
  status: number | null;
  code: string | null;
  message: string;
} {
  if (error instanceof BroRacksAuthError || error instanceof BroRacksRejectedError) {
    return {
      status: error.status,
      code: error.code,
      message: redactSecrets(error.providerMessage ?? error.message),
    };
  }
  if (error instanceof BroRacksTimeoutError) {
    return { status: null, code: "TIMEOUT", message: error.message };
  }
  return {
    status: null,
    code: null,
    message: redactSecrets(
      error instanceof Error ? error.message : "Unknown error",
    ),
  };
}

// ---------------------------------------------------------------------------
// Initiate a Mobile Money collection (sends a prompt to the payer's phone)
// ---------------------------------------------------------------------------
export async function initiateCollection(
  params: CollectionParams,
): Promise<CollectionResult> {
  const send = async (token: string): Promise<Response> => {
    try {
      return await fetchWithTimeout(
        `${getBroRacksApiUrl()}/v1/collections/initiate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Idempotency-Key": params.idempotencyKey,
          },
          body: JSON.stringify({
            payer_name: params.payerName,
            phone_number: params.phoneNumber,
            amount: params.amount,
            description: params.description,
          }),
        },
        REQUEST_TIMEOUT_MS,
      );
    } catch (e) {
      if (isAbortError(e)) {
        console.error("[broracks] collection request timed out:", e);
        throw new BroRacksTimeoutError("BroRacks did not respond in time");
      }
      console.error("[broracks] collection request network error:", e);
      throw new Error("Could not reach BroRacks to start the payment");
    }
  };

  let res = await send(await getSessionToken());
  // A cached token can be revoked/expire early; refresh once and retry. Safe
  // because the Idempotency-Key is unchanged.
  if (res.status === 401) {
    clearTokenCache();
    res = await send(await getSessionToken());
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    const info = broRacksErrorDetails(errorBody);
    console.error(
      `[broracks] collection initiate failed: status=${res.status} code=${info.code ?? "none"} message=${info.message ?? "none"}`,
    );
    if (res.status === 401 || res.status === 403) {
      throw new BroRacksAuthError(
        `BroRacks auth failed (${res.status})`,
        res.status,
        info.code,
        info.message,
      );
    }
    throw new BroRacksRejectedError(
      `BroRacks collection failed (${res.status})`,
      info.message,
      res.status,
      info.code,
    );
  }

  const data = await res.json().catch(() => null);
  const record =
    data && typeof data === "object"
      ? (data as { success?: boolean; message?: string })
      : null;

  // Prefer a BRR-* id. Status checks and webhooks address the collection by it,
  // and GET /v1/collections/{reference} also accepts the merchant reference.
  const reference = collectionReferenceFrom(data);

  if (!record || record.success === false || !reference) {
    console.error("[broracks] collection initiate returned no usable reference");
    throw new BroRacksRejectedError(
      `BroRacks collection was not accepted${record?.message ? `: ${record.message}` : ""}`,
      providerMessageFrom(data),
      res.status,
    );
  }

  return { success: true, reference, message: record.message };
}

// ---------------------------------------------------------------------------
// Verify that a phone number is a registered MTN or Airtel Mobile Money
// number. BroRacks documents this as GET /v1/verify/phone/{msisdn}.
// ---------------------------------------------------------------------------
export async function verifyPhone(phoneNumber: string) {
  const msisdn = phoneNumber.trim();
  const url = `${getBroRacksApiUrl()}/v1/verify/phone/${encodeURIComponent(msisdn)}`;

  const send = async (token: string): Promise<Response> => {
    try {
      return await fetchWithTimeout(
        url,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
        REQUEST_TIMEOUT_MS,
      );
    } catch (e) {
      console.error(
        `[broracks] phone verify ${isAbortError(e) ? "timed out" : "network error"}`,
      );
      throw new Error("Could not reach BroRacks to verify the phone number");
    }
  };

  let res = await send(await getSessionToken());
  // A cached token can expire inside the 4-minute window; refresh once.
  if (res.status === 401) {
    clearTokenCache();
    res = await send(await getSessionToken());
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    const info = broRacksErrorDetails(errorBody);
    console.error(
      `[broracks] phone verify failed: status=${res.status} code=${info.code ?? "none"} message=${info.message ?? "none"}`,
    );
    if (res.status === 401 || res.status === 403) {
      throw new BroRacksAuthError(
        `BroRacks auth failed (${res.status})`,
        res.status,
        info.code,
        info.message,
      );
    }
    throw new BroRacksRejectedError(
      `BroRacks phone verify failed (${res.status})`,
      info.message,
      res.status,
      info.code,
    );
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Collection status — GET /v1/collections/{reference}, with a real-time
// POST /v1/transactions/{reference}/check-status first (BroRacks docs).
// Does not create a charge.
// ---------------------------------------------------------------------------
export async function fetchCollectionStatus(reference: string): Promise<{
  state: ProviderPaymentState;
  amount: number | null;
  currency: string | null;
}> {
  const encoded = encodeURIComponent(reference.trim());
  const checkUrl = `${getBroRacksApiUrl()}/v1/transactions/${encoded}/check-status`;
  const readUrl = `${getBroRacksApiUrl()}/v1/collections/${encoded}`;

  const request = async (url: string, method: "GET" | "POST"): Promise<Response> => {
    const send = (token: string) =>
      fetchWithTimeout(
        url,
        { method, headers: { Authorization: `Bearer ${token}` } },
        REQUEST_TIMEOUT_MS,
      );
    let res = await send(await getSessionToken());
    if (res.status === 401) {
      clearTokenCache();
      res = await send(await getSessionToken());
    }
    return res;
  };

  let res: Response;
  try {
    res = await request(checkUrl, "POST");
  } catch (error) {
    console.error(
      `[broracks] collection status ${isAbortError(error) ? "timed out" : "network error"}`,
    );
    throw new Error("Could not reach BroRacks to check the payment");
  }

  if (res.status === 404 || res.status === 405 || (res.status >= 400 && res.status !== 401 && res.status !== 403)) {
    try {
      const fallback = await request(readUrl, "GET");
      if (fallback.ok || fallback.status === 404) res = fallback;
    } catch (error) {
      console.error(
        `[broracks] collection read ${isAbortError(error) ? "timed out" : "network error"}`,
      );
    }
  }

  if (res.status === 404) {
    return { state: "failed", amount: null, currency: null };
  }
  if (!res.ok) {
    const info = broRacksErrorDetails(await res.text().catch(() => ""));
    console.error(
      `[broracks] collection status failed: status=${res.status} code=${info.code ?? "none"} message=${info.message ?? "none"}`,
    );
    if (res.status === 401 || res.status === 403) {
      throw new BroRacksAuthError(
        `BroRacks auth failed (${res.status})`,
        res.status,
        info.code,
        info.message,
      );
    }
    return { state: "unknown", amount: null, currency: null };
  }

  const body = await res.json().catch(() => null);
  return parseProviderPaymentState(body);
}
