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
}) {
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
  return res.json();
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
