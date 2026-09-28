// ---------------------------------------------------------------------------
// BroRacks — Mobile Money payment integration (MTN & Airtel Uganda)
//
// Responsibilities:
//   1. getSessionToken()      — authenticates and caches the bearer token
//   2. initiateCollection()   — sends a Mobile Money prompt to a payer's phone
//   3. verifyPhone()          — checks if a number is a valid Mobile Money number
//
// Every request to the provider has a hard timeout so a hung BroRacks API can
// never hold a serverless function (and the learner's spinner) open
// indefinitely.
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.broracks.online";

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
// The token is reused until 5 minutes before it expires.
// ---------------------------------------------------------------------------
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0; // Unix timestamp in milliseconds

function clearTokenCache() {
  cachedToken = null;
  tokenExpiresAt = 0;
}

async function getSessionToken(): Promise<string> {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  // Return cached token if it's still valid
  if (cachedToken && now < tokenExpiresAt - fiveMinutes) {
    return cachedToken;
  }

  if (!process.env.BRORACKS_PUBLIC_KEY || !process.env.BRORACKS_SECRET_KEY) {
    console.error(
      "[broracks] BRORACKS_PUBLIC_KEY / BRORACKS_SECRET_KEY not configured",
    );
    throw new Error("BroRacks is not configured");
  }

  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${BASE_URL}/v1/auth/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_key: process.env.BRORACKS_PUBLIC_KEY,
          secret_key: process.env.BRORACKS_SECRET_KEY,
        }),
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
    console.error(
      `[broracks] auth failed: ${res.status} ${res.statusText} — ${body}`,
    );
    throw new Error(`BroRacks auth failed (${res.status})`);
  }

  const data = await res.json().catch(() => null);

  if (!data?.data?.token) {
    // Don't log the full body: it may echo credentials.
    console.error("[broracks] auth response missing token");
    throw new Error("BroRacks auth response did not include a token");
  }

  // Cache the token. BroRacks tokens typically last 1 hour — adjust if different.
  cachedToken = data.data.token as string;
  tokenExpiresAt = now + 60 * 60 * 1000; // 1 hour from now

  return cachedToken;
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

// ---------------------------------------------------------------------------
// Initiate a Mobile Money collection (sends a prompt to the payer's phone)
// ---------------------------------------------------------------------------
export async function initiateCollection(
  params: CollectionParams,
): Promise<CollectionResult> {
  const send = async (token: string): Promise<Response> => {
    try {
      return await fetchWithTimeout(
        `${BASE_URL}/v1/collections/initiate`,
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
    // Full status + provider response so the cause is visible in the logs.
    console.error(
      `[broracks] collection initiate failed: ${res.status} ${res.statusText} — ${errorBody}`,
    );
    throw new Error(`BroRacks collection failed (${res.status})`);
  }

  const data = (await res.json().catch(() => null)) as
    | (Partial<CollectionResult> & { data?: { reference?: string } })
    | null;

  // Accept the reference at the top level or nested under `data`.
  const reference = data?.reference ?? data?.data?.reference;

  if (!data || data.success === false || typeof reference !== "string" || !reference) {
    console.error(
      "[broracks] collection initiate returned no usable reference:",
      JSON.stringify(data),
    );
    throw new Error(
      `BroRacks collection was not accepted${data?.message ? `: ${data.message}` : ""}`,
    );
  }

  return { success: true, reference, message: data.message };
}

// ---------------------------------------------------------------------------
// Verify that a phone number is a valid Mobile Money number before charging
// ---------------------------------------------------------------------------
export async function verifyPhone(phoneNumber: string) {
  const token = await getSessionToken();

  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${BASE_URL}/v1/verify/phone`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone_number: phoneNumber }),
      },
      REQUEST_TIMEOUT_MS,
    );
  } catch (e) {
    console.error("[broracks] phone verify network error/timeout:", e);
    throw new Error("Could not reach BroRacks to verify the phone number");
  }

  if (!res.ok) {
    throw new Error(`BroRacks phone verify failed: ${res.status}`);
  }

  return res.json();
}
