import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BroRacksAuthError,
  BroRacksRejectedError,
  BroRacksTimeoutError,
  checkBroRacksAuth,
  clearTokenCache,
  describeBroRacksFailure,
  getBroRacksApiUrl,
  getBroRacksHealth,
  fetchCollectionStatus,
  initiateCollection,
  PAYMENTS_UNAVAILABLE_MESSAGE,
  providerMessageFrom,
  userMessageForCollectionFailure,
  verifyPhone,
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
  vi.useRealTimers();
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

  it("reuses a token for just under 4 minutes and refreshes at 4 minutes", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    fetchMock
      .mockResolvedValueOnce(tokenOk("t1"))
      .mockResolvedValueOnce(collectionOk())
      .mockResolvedValueOnce(collectionOk())
      .mockResolvedValueOnce(tokenOk("t2"))
      .mockResolvedValueOnce(collectionOk());

    await initiateCollection(params);
    vi.setSystemTime(new Date("2026-01-01T00:03:59.000Z"));
    await initiateCollection(params);
    vi.setSystemTime(new Date("2026-01-01T00:04:00.000Z"));
    await initiateCollection(params);

    const authCalls = fetchMock.mock.calls.filter((c) =>
      urlOf(c).endsWith("/v1/auth/token"),
    );
    expect(authCalls).toHaveLength(2);
    const headers = (fetchMock.mock.calls[2][1] as RequestInit).headers as Record<
      string,
      string
    >;
    expect(headers.Authorization).toBe("Bearer t1");
    const refreshed = (fetchMock.mock.calls[4][1] as RequestInit).headers as Record<
      string,
      string
    >;
    expect(refreshed.Authorization).toBe("Bearer t2");
  });

  it("never caches a token for longer than 4 minutes even if it claims a longer life", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    fetchMock
      .mockResolvedValueOnce(json({ data: { token: "t1", expires_in: 3600 } }))
      .mockResolvedValueOnce(collectionOk())
      .mockResolvedValueOnce(tokenOk("t2"))
      .mockResolvedValueOnce(collectionOk());

    await initiateCollection(params);
    vi.setSystemTime(new Date("2026-01-01T00:04:00.000Z"));
    await initiateCollection(params);

    const authCalls = fetchMock.mock.calls.filter((c) =>
      urlOf(c).endsWith("/v1/auth/token"),
    );
    expect(authCalls).toHaveLength(2);
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

  it("logs the BroRacks error code and message, never the raw body", async () => {
    fetchMock.mockResolvedValueOnce(
      json(
        {
          type: "https://docs.broracks.online/errors/invalid_credentials",
          title: "Invalid Credentials",
          status: 401,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid API keys. Check your public and secret keys.",
          },
          secret_key: "sk_live_should_not_appear",
          public_key: "pk_live_should_not_appear",
        },
        401,
      ),
    );
    const errorSpy = vi.spyOn(console, "error");
    expect(await checkBroRacksAuth()).toEqual({
      ok: false,
      status: 401,
      code: "INVALID_CREDENTIALS",
      error: "BroRacks auth failed (401)",
    });
    const logged = errorSpy.mock.calls.flat().join(" ");
    expect(logged).toContain("code=INVALID_CREDENTIALS");
    expect(logged).toContain("Invalid API keys. Check your public and secret keys.");
    expect(logged).not.toContain("sk_live_should_not_appear");
    expect(logged).not.toContain("pk_live_should_not_appear");
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

  it("reports the www canonical host when the apex URL is configured", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://amqualitysystems.com/";
    fetchMock.mockResolvedValueOnce(tokenOk("tok_abc"));
    const health = await getBroRacksHealth();
    expect(health.webhookUrl).toBe(
      "https://www.amqualitysystems.com/api/webhooks/broracks",
    );
  });

  it("omits webhookUrl when NEXT_PUBLIC_SITE_URL is unset", async () => {
    delete process.env.BRORACKS_PUBLIC_KEY;
    const health = await getBroRacksHealth();
    expect(health.webhookUrl).toBeUndefined();
    expect(health.configured.publicKey).toBe(false);
    expect(health.auth.ok).toBe(false);
  });
});

describe("initiateCollection amount limits", () => {
  it("rejects amounts outside whole UGX 500–7,000,000 before calling BroRacks", async () => {
    for (const amount of [499, 7_000_001, 1000.4, 0]) {
      await expect(initiateCollection({ ...params, amount })).rejects.toBeInstanceOf(
        BroRacksRejectedError,
      );
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts the inclusive bounds", async () => {
    fetchMock.mockResolvedValueOnce(tokenOk("t1")).mockResolvedValueOnce(collectionOk());
    await initiateCollection({ ...params, amount: 500 });
    expect(bodyOf(fetchMock.mock.calls[1]).amount).toBe(500);
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

describe("userMessageForCollectionFailure", () => {
  it("does not blame the phone number when auth fails", () => {
    const error = new BroRacksAuthError(
      "BroRacks auth failed (401)",
      401,
      "INVALID_CREDENTIALS",
      "Invalid API keys. Check your public and secret keys.",
    );
    expect(userMessageForCollectionFailure(error)).toBe(
      PAYMENTS_UNAVAILABLE_MESSAGE,
    );
    expect(userMessageForCollectionFailure(error)).not.toMatch(/number/i);
    expect(describeBroRacksFailure(error)).toEqual({
      status: 401,
      code: "INVALID_CREDENTIALS",
      message: "Invalid API keys. Check your public and secret keys.",
    });
  });

  it("uses the unavailable message for server and network faults", () => {
    expect(
      userMessageForCollectionFailure(
        new BroRacksRejectedError("BroRacks collection failed (502)", null, 502),
      ),
    ).toBe(PAYMENTS_UNAVAILABLE_MESSAGE);
    expect(
      userMessageForCollectionFailure(
        new BroRacksRejectedError(
          "BroRacks collection failed (500)",
          "Internal error",
          500,
          "SERVER_ERROR",
        ),
      ),
    ).toBe(PAYMENTS_UNAVAILABLE_MESSAGE);
    expect(
      userMessageForCollectionFailure(new Error("Could not reach BroRacks to authenticate")),
    ).toBe(PAYMENTS_UNAVAILABLE_MESSAGE);
  });

  it("mentions the number only for a real phone rejection", () => {
    const error = new BroRacksRejectedError(
      "BroRacks collection failed (400)",
      "Invalid phone number",
      400,
      "INVALID_PHONE",
    );
    expect(userMessageForCollectionFailure(error)).toContain("Check the number");
    expect(userMessageForCollectionFailure(error)).toContain("Invalid phone number");
  });

  it("keeps the timeout copy, which does not blame the number", () => {
    const message = userMessageForCollectionFailure(
      new BroRacksTimeoutError("BroRacks did not respond in time"),
    );
    expect(message).toMatch(/taking too long/i);
    expect(message).not.toContain(PAYMENTS_UNAVAILABLE_MESSAGE);
    expect(message).not.toMatch(/check the number/i);
  });
});

describe("fetchCollectionStatus", () => {
  it("forces a status sync, then reads the collection, without charging", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenOk("t1"))
      .mockResolvedValueOnce(json({ status: "success" }, 404))
      .mockResolvedValueOnce(
        json({ status: "success", data: { status: "CANCELLED", amount: 1000, currency: "UGX" } }),
      );

    await expect(fetchCollectionStatus("BRR-1")).resolves.toEqual({
      state: "failed",
      amount: 1000,
      currency: "UGX",
    });

    expect(urlOf(fetchMock.mock.calls[1])).toBe(
      "https://api.broracks.online/v1/transactions/BRR-1/check-status",
    );
    expect((fetchMock.mock.calls[1][1] as RequestInit).method).toBe("POST");
    expect(urlOf(fetchMock.mock.calls[2])).toBe(
      "https://api.broracks.online/v1/collections/BRR-1",
    );
    expect((fetchMock.mock.calls[2][1] as RequestInit).method).toBe("GET");
    const urls = fetchMock.mock.calls.map((call) => urlOf(call));
    expect(urls.some((url) => url.includes("/collections/initiate"))).toBe(false);
  });
});

describe("verifyPhone", () => {
  it("GETs /v1/verify/phone/{msisdn} with the bearer token and no body", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenOk("t1"))
      .mockResolvedValueOnce(json({ data: { name: "Jane", network: "MTN" } }));

    const result = await verifyPhone("+256771234567");

    expect(result).toEqual({ data: { name: "Jane", network: "MTN" } });
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(
      "https://api.broracks.online/v1/verify/phone/%2B256771234567",
    );
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer t1",
    );
  });

  it("refreshes a rejected token once", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenOk("stale"))
      .mockResolvedValueOnce(json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid token." } }, 401))
      .mockResolvedValueOnce(tokenOk("fresh"))
      .mockResolvedValueOnce(json({ data: { name: "Jane" } }));

    await expect(verifyPhone("+256701234567")).resolves.toEqual({
      data: { name: "Jane" },
    });
    expect(urlOf(fetchMock.mock.calls[3])).toBe(
      "https://api.broracks.online/v1/verify/phone/%2B256701234567",
    );
    expect(
      ((fetchMock.mock.calls[3][1] as RequestInit).headers as Record<string, string>)
        .Authorization,
    ).toBe("Bearer fresh");
  });

  it("logs code and message when verification is rejected", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenOk("t1"))
      .mockResolvedValueOnce(
        json(
          {
            error: {
              code: "INVALID_PHONE",
              message: "Invalid phone number",
              secret_key: "sk_live_nope",
            },
          },
          400,
        ),
      );
    const errorSpy = vi.spyOn(console, "error");
    await expect(verifyPhone("+256771234567")).rejects.toBeInstanceOf(
      BroRacksRejectedError,
    );
    const logged = errorSpy.mock.calls.flat().join(" ");
    expect(logged).toContain("code=INVALID_PHONE");
    expect(logged).toContain("Invalid phone number");
    expect(logged).not.toContain("sk_live_nope");
  });
});
