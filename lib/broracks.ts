// ---------------------------------------------------------------------------
// BroRacks — Mobile Money payment integration (MTN & Airtel Uganda)
//
// Two responsibilities:
//   1. getSessionToken()      — authenticates and caches the bearer token
//   2. initiateCollection()   — sends a Mobile Money prompt to a payer's phone
//   3. verifyPhone()          — checks if a number is a valid Mobile Money number
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.broracks.online";

// ---------------------------------------------------------------------------
// Token cache — avoids a fresh auth round-trip on every payment request.
// The token is reused until 5 minutes before it expires.
// ---------------------------------------------------------------------------
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0; // Unix timestamp in milliseconds

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
    res = await fetch(`${BASE_URL}/v1/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        public_key: process.env.BRORACKS_PUBLIC_KEY,
        secret_key: process.env.BRORACKS_SECRET_KEY,
      }),
    });
  } catch (e) {
    // Network-level failure (DNS, timeout, connection refused).
    console.error("[broracks] auth request network error:", e);
    throw new Error("Could not reach BroRacks to authenticate");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `[broracks] auth failed: ${res.status} ${res.statusText} — ${body}`,
    );
    throw new Error(`BroRacks auth failed (${res.status})`);
  }

  const data = await res.json();

  if (!data?.data?.token) {
    console.error(
      "[broracks] auth response missing token:",
      JSON.stringify(data),
    );
    throw new Error("BroRacks auth response did not include a token");
  }

  // Cache the token. BroRacks tokens typically last 1 hour — adjust if different.
  cachedToken = data.data.token;
  tokenExpiresAt = now + 60 * 60 * 1000; // 1 hour from now

  return data.data.token;
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

// ---------------------------------------------------------------------------
// Initiate a Mobile Money collection (sends a prompt to the payer's phone)
// ---------------------------------------------------------------------------
export async function initiateCollection(
  params: CollectionParams,
): Promise<CollectionResult> {
  const token = await getSessionToken();

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/v1/collections/initiate`, {
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
    });
  } catch (e) {
    console.error("[broracks] collection request network error:", e);
    throw new Error("Could not reach BroRacks to start the payment");
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    // Full status + provider response so the cause is visible in the logs.
    console.error(
      `[broracks] collection initiate failed: ${res.status} ${res.statusText} — ${errorBody}`,
    );
    throw new Error(`BroRacks collection failed (${res.status})`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Verify that a phone number is a valid Mobile Money number before charging
// ---------------------------------------------------------------------------
export async function verifyPhone(phoneNumber: string) {
  const token = await getSessionToken();

  const res = await fetch(`${BASE_URL}/v1/verify/phone`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone_number: phoneNumber }),
  });

  if (!res.ok) {
    throw new Error(`BroRacks phone verify failed: ${res.status}`);
  }

  return res.json();
}
