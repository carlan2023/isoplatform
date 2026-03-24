const BASE_URL = "https://api.broracks.online";

async function getSessionToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      public_key: process.env.BRORACKS_PUBLIC_KEY,
      secret_key: process.env.BRORACKS_SECRET_KEY,
    }),
  });
  const data = await res.json();
  if (!data?.data?.token) throw new Error("Failed to get BroRacks token");
  return data.data.token;
}

function extractReference(json: Record<string, unknown>): string | null {
  const data = json.data as Record<string, unknown> | undefined;
  const ref =
    (typeof data?.reference === "string" && data.reference) ||
    (typeof data?.collection_reference === "string" && data.collection_reference) ||
    (typeof json.reference === "string" && json.reference) ||
    (typeof json.collection_reference === "string" && json.collection_reference) ||
    (typeof data?.id === "string" && data.id);
  return ref || null;
}

export type InitiateCollectionResult = {
  reference: string;
  raw: Record<string, unknown>;
};

export async function initiateCollection({
  payerName,
  phoneNumber,
  amount,
  description,
  idempotencyKey,
}: {
  payerName: string;
  phoneNumber: string;
  amount: number;
  description: string;
  idempotencyKey: string;
}): Promise<InitiateCollectionResult> {
  const token = await getSessionToken();
  const res = await fetch(`${BASE_URL}/v1/collections/initiate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      payer_name: payerName,
      phone_number: phoneNumber,
      amount,
      description,
    }),
  });

  const json = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    const msg =
      (typeof json.message === "string" && json.message) ||
      (typeof json.error === "string" && json.error) ||
      JSON.stringify(json);
    throw new Error(`BroRacks initiate failed (${res.status}): ${msg}`);
  }

  const reference = extractReference(json);
  if (!reference) {
    console.error("[broracks] unexpected initiate response:", json);
    throw new Error("BroRacks did not return a payment reference");
  }

  return { reference, raw: json };
}

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
  return res.json();
}
