import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkBroRacksAuth,
  clearTokenCache,
  getBroRacksApiUrl,
  getBroRacksHealth,
  initiateCollection,
  providerMessageFrom,
} from "./broracks";

const ENV_KEYS = [
  "BRORACKS_API_URL",
  "BRORACKS_PUBLIC_KEY",
  "BRORACKS_SECRET_KEY",
  "BRORACKS_WEBHOOK_SECRET",
  "BRORACKS_WEBHOOK_SECRET_PREVIOUS",
  "NEXT_PUBLIC_SITE_URL",
] as const;
const savedEnv: Record<string, string | undefined> = {};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const tokenOk = (token: string) => json({ data: { token } });
const collectionOk = () => json({ success: true, reference: "ref_1" });

const params = {
  payerName: "Test",
  phoneNumber: "+256771234567",
  amount: 1000,
  description: "Test",
  idempotencyKey: "idem-1",
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  for (const k of ENV_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
  process.env.BRORACKS_PUBLIC_KEY = "pk_new";
  process.env.BRORACKS_SECRET_KEY = "sk_new";
  clearTokenCache();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const urlOf = (call: unknown[]) => String(call[0]);
const bodyOf = (call: unknown[]) =>
  JSON.parse(String((call[1] as RequestInit).body));

describe("getBroRacksApiUrl", () => {
  it("defaults to the production API", () => {
    expect(getBroRacksApiUrl()).toBe("https://api.broracks.online");
  });

  it("uses BRORACKS_API_URL, trimmed and without trailing slashes", () => {
    process.env.BRORACKS_API_URL = "  https://sandbox.example.com/api//  ";
    expect(getBroRacksApiUrl()).toBe("https://sandbox.example.com/api");
  });

  it("is read at call time for every request", async () => {
    process.env.BRORACKS_API_URL = "https://alt.example.com/";
    fetchMock
      .mockResolvedValueOnce(tokenOk("t1"))
      .mockResolvedValueOnce(collectionOk());
    await initiateCollection(params);
    expect(urlOf(fetchMock.mock.calls[0])).toBe(
      "https://alt.example.com/v1/auth/token",
    );
    expect(urlOf(fetchMock.mock.calls[1])).toBe(
      "https://alt.example.com/v1/collections/initiate",
    );
  });
});

describe("credentials and token cache", () => {
  it("trims whitespace from the keys before sending them", async () => {
    process.env.BRORACKS_PUBLIC_KEY = "  pk_new\n";
    process.env.BRORACKS_SECRET_KEY = "\tsk_new ";
    fetchMock
      .mockResolvedValueOnce(tokenOk("t1"))
      .mockResolvedValueOnce(collectionOk());
    await initiateCollection(params);
    expect(bodyOf(fetchMock.mock.calls[0])).toEqual({
      public_key: "pk_new",
      secret_key: "sk_new",
    });
  });

  it("treats whitespace-only keys as not configured", async () => {
    process.env.BRORACKS_PUBLIC_KEY = "   ";
    await expect(initiateCollection(params)).rejects.toThrow(
      "BroRacks is not configured",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reuses the cached token for the same public key", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenOk("t1"))
      .mockResolvedValueOnce(collectionOk())
      .mockResolvedValueOnce(collectionOk());
    await initiateCollection(params);
    await initiateCollection(params);
    const authCalls = fetchMock.mock.calls.filter((c) =>
      urlOf(c).endsWith("/v1/auth/token"),
    );
    expect(authCalls).toHaveLength(1);
  });

  it("never reuses a token issued to a different public key", async () => {
    process.env.BRORACKS_PUBLIC_KEY = "pk_old";
    fetchMock
      .mockResolvedValueOnce(tokenOk("old_token"))
      .mockResolvedValueOnce(collectionOk());
    await initiateCollection(params);

    process.env.BRORACKS_PUBLIC_KEY = "pk_new";
    fetchMock
      .mockResolvedValueOnce(tokenOk("new_token"))
      .mockResolvedValueOnce(collectionOk());
    await initiateCollection(params);

    const [, , auth2, collect2] = fetchMock.mock.calls;
    expect(bodyOf(auth2).public_key).toBe("pk_new");
    const headers = (collect2[1] as RequestInit).headers as Record<
      string,
      string
    >;
    expect(headers.Authorization).toBe("Bearer new_token");
  });
});

describe("checkBroRacksAuth", () => {
  it("reports ok without exposing the token", async () => {
    fetchMock.mockResolvedValueOnce(tokenOk("secret_token"));
    const result = await checkBroRacksAuth();
    expect(result).toEqual({ ok: true });
    expect(JSON.stringify(result)).not.toContain("secret_token");
  });

  it("always performs a fresh token request", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenOk("t1"))
      .mockResolvedValueOnce(tokenOk("t2"));
    await checkBroRacksAuth();
    await checkBroRacksAuth();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports the HTTP status when credentials are rejected", async () => {
    fetchMock.mockResolvedValueOnce(json({ message: "bad key" }, 401));
    expect(await checkBroRacksAuth()).toEqual({
      ok: false,
      status: 401,
      error: "BroRacks auth failed (401)",
    });
  });

  it("reports network failures and missing config", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect(await checkBroRacksAuth()).toEqual({
      ok: false,
      error: "Could not reach BroRacks to authenticate",
    });

    delete process.env.BRORACKS_SECRET_KEY;
    expect(await checkBroRacksAuth()).toEqual({
      ok: false,
      error: "BroRacks is not configured",
    });
  });
});

describe("getBroRacksHealth", () => {
  it("reports configuration flags, API/webhook URLs and auth — never values", async () => {
    process.env.BRORACKS_WEBHOOK_SECRET = "whsec_new";
    process.env.BRORACKS_WEBHOOK_SECRET_PREVIOUS = "  ";
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/";
    fetchMock.mockResolvedValueOnce(tokenOk("tok_abc"));

    const health = await getBroRacksHealth();
    expect(health).toEqual({
      configured: {
        publicKey: true,
        secretKey: true,
        webhookSecret: true,
        previousWebhookSecret: false,
      },
      apiUrl: "https://api.broracks.online",
      auth: { ok: true },
      webhookUrl: "https://example.com/api/webhooks/broracks",
    });
    const text = JSON.stringify(health);
    for (const secret of ["pk_new", "sk_new", "whsec_new", "tok_abc"]) {
      expect(text).not.toContain(secret);
    }
  });

  it("omits webhookUrl when NEXT_PUBLIC_SITE_URL is unset", async () => {
    delete process.env.BRORACKS_PUBLIC_KEY;
    const health = await getBroRacksHealth();
    expect(health.webhookUrl).toBeUndefined();
    expect(health.configured.publicKey).toBe(false);
    expect(health.auth.ok).toBe(false);
  });
});

describe("providerMessageFrom", () => {
  it("reads a top-level message from a JSON string", () => {
    expect(providerMessageFrom('{"message":"Invalid phone number"}')).toBe(
      "Invalid phone number",
    );
  });

  it("reads nested error messages", () => {
    expect(providerMessageFrom({ error: { message: "Limit exceeded" } })).toBe(
      "Limit exceeded",
    );
    expect(providerMessageFrom({ error: "Unsupported network" })).toBe(
      "Unsupported network",
    );
  });

  it("returns plain text but never HTML error pages", () => {
    expect(providerMessageFrom("Bad Request")).toBe("Bad Request");
    expect(providerMessageFrom("<!DOCTYPE html><html>502</html>")).toBeNull();
  });

  it("returns null when there is nothing usable", () => {
    expect(providerMessageFrom("")).toBeNull();
    expect(providerMessageFrom({ success: false })).toBeNull();
    expect(providerMessageFrom(null)).toBeNull();
  });

  it("caps very long messages", () => {
    expect(providerMessageFrom({ message: "x".repeat(500) })?.length).toBe(200);
  });
});
