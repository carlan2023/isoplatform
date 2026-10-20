import { describe, expect, it } from "vitest";
import {
  applyCertAdminCommand,
  isCertAdminAuthorized,
  parseCertAdminBody,
} from "./cert-admin";
import {
  CERTIFICATE_CSV_TEMPLATE,
  DEMO_CERTIFICATE_INPUTS,
  buildCertificateId,
  createMemoryCertificateStore,
} from "./certificates";

const secret = "test-cert-admin-token";

describe("certificate admin token", () => {
  it("accepts only the bearer token and fails closed when it is unset", () => {
    expect(isCertAdminAuthorized(`Bearer ${secret}`, secret)).toBe(true);
    expect(isCertAdminAuthorized(null, secret)).toBe(false);
    expect(isCertAdminAuthorized(`Bearer ${secret}`, undefined)).toBe(false);
    expect(isCertAdminAuthorized(`Bearer ${secret}`, "")).toBe(false);
    expect(isCertAdminAuthorized("Bearer wrong", secret)).toBe(false);
    expect(isCertAdminAuthorized(secret, secret)).toBe(false);
    expect(isCertAdminAuthorized(`Bearer ${secret} `, secret)).toBe(false);
  });
});

describe("certificate admin commands", () => {
  const added = {
    certificateId: buildCertificateId(2026, "LA", 14),
    holderFullName: "Sample Holder",
    course: "ISO 9001 Lead Auditor",
    trainingStart: "2026-01-06",
    trainingEnd: "2026-01-10",
    issueDate: "2026-01-12",
    status: "valid" as const,
  };

  it("adds one certificate and revokes it", async () => {
    const store = createMemoryCertificateStore();
    const parsed = parseCertAdminBody({ action: "add", certificate: added });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const created = await applyCertAdminCommand(store, parsed.command);
    expect(created).toMatchObject({ ok: true, action: "add" });

    const revoke = parseCertAdminBody({
      action: "revoke",
      certificateId: "nq26-la-014-e",
    });
    expect(revoke.ok).toBe(true);
    if (!revoke.ok) return;
    const revoked = await applyCertAdminCommand(store, revoke.command);
    expect(revoked).toMatchObject({
      ok: true,
      action: "revoke",
      certificates: [{ certificateId: added.certificateId, status: "revoked" }],
    });
  });

  it("refuses a bad check letter and does not write a partial bulk file", async () => {
    const store = createMemoryCertificateStore(DEMO_CERTIFICATE_INPUTS);
    const bad = parseCertAdminBody({
      action: "bulk",
      certificates: [
        added,
        { ...added, certificateId: "NQ26LA014K" },
      ],
    });
    expect(bad.ok).toBe(false);
    expect(await store.list()).toHaveLength(2);

    const csv = parseCertAdminBody({ action: "bulk", csv: CERTIFICATE_CSV_TEMPLATE });
    expect(csv.ok).toBe(true);
    if (!csv.ok) return;
    const result = await applyCertAdminCommand(store, csv.command);
    expect(result).toMatchObject({ ok: true, action: "bulk", inserted: 1, updated: 0 });
  });

  it("leaves every row unchanged when one revoke target is missing", async () => {
    const store = createMemoryCertificateStore(DEMO_CERTIFICATE_INPUTS);
    const parsed = parseCertAdminBody({
      action: "revoke",
      certificateIds: [DEMO_CERTIFICATE_INPUTS[0].certificateId, buildCertificateId(2026, "LA", 999)],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = await applyCertAdminCommand(store, parsed.command);
    expect(result).toMatchObject({ ok: false, status: 404 });
    const rows = await store.list();
    expect(rows.every((row) => row.status === DEMO_CERTIFICATE_INPUTS.find((demo) => demo.certificateId === row.certificateId)?.status)).toBe(true);
  });
});
