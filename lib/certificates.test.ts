import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { demoSeedEnabled, localMemoryCertificateStore } from "./certificate-runtime";
import {
  certificateQrPng,
  certificateQrSvg,
  certificateVerifyUrl,
  requestPublicOrigin,
} from "./certificate-qr";
import {
  CERTIFICATE_CSV_TEMPLATE,
  CERTIFICATE_DISCLAIMER,
  CERTIFICATE_ID_EXAMPLE,
  CHECK_ALPHABET,
  DEMO_CERTIFICATE_INPUTS,
  DEMO_INTERNAL_AUDITOR_ID,
  DEMO_LEAD_AUDITOR_ID,
  VERIFY_PAGE_TITLE,
  VERIFY_RATE_LIMIT,
  VERIFY_RATE_WINDOW_MS,
  assignNextCertificateId,
  buildCertificateId,
  certificateIdFromPath,
  checkLetterForBody,
  classifyCertificateId,
  createMemoryCertificateStore,
  createRateLimiter,
  formatCertificateDate,
  holderSurnameMatches,
  isCertificateId,
  lookupCertificate,
  normalizeCertificateId,
  parseCertificateCsv,
  removeDemoCertificates,
  toPublicCertificate,
  validateCertificateInput,
  type CertificateRecord,
} from "./certificates";

function source(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

const PUBLIC_KEYS = [
  "certificateId",
  "holderName",
  "course",
  "trainingStart",
  "trainingEnd",
  "issueDate",
  "status",
];

describe("certificate ids", () => {
  it("builds a 10-character number and checks the letter", () => {
    expect(CHECK_ALPHABET).toHaveLength(23);
    expect(CHECK_ALPHABET).not.toMatch(/[IOU]/);
    expect(checkLetterForBody("NQ26LA000")).toBe("G");
    expect(checkLetterForBody("NQ26IA000")).toBe("Q");
    expect(buildCertificateId(2026, "LA", 14)).toBe("NQ26LA014E");
    expect(CERTIFICATE_ID_EXAMPLE).toBe("NQ26LA014E");
    expect(DEMO_LEAD_AUDITOR_ID).toBe("NQ26LA000G");
    expect(DEMO_INTERNAL_AUDITOR_ID).toBe("NQ26IA000Q");
    expect(DEMO_LEAD_AUDITOR_ID).toHaveLength(10);

    expect(normalizeCertificateId(" nq26-la-014-e ")).toBe("NQ26LA014E");
    expect(normalizeCertificateId("NQ 26 LA 014 E")).toBe("NQ26LA014E");
    expect(isCertificateId("nq26-la-014-e")).toBe(true);
    expect(classifyCertificateId("NQ26LA014K")).toBe("invalid_number");
    expect(classifyCertificateId("NQ26LA014I")).toBe("invalid_number");
    expect(classifyCertificateId("NAMQMS/TRN/2026/0001")).toBe("malformed");
    expect(classifyCertificateId("NQ26XX014E")).toBe("malformed");
    expect(certificateIdFromPath(["NQ26LA014E"])).toBe("NQ26LA014E");
    expect(certificateIdFromPath(["nq26-la-000-g"])).toBe("nq26-la-000-g");
    expect(normalizeCertificateId(certificateIdFromPath(["nq26-la-000-g"]))).toBe(
      DEMO_LEAD_AUDITOR_ID,
    );
  });

  it("assigns the next serial per year and course, skipping sample 000", async () => {
    const store = createMemoryCertificateStore(DEMO_CERTIFICATE_INPUTS);
    await expect(assignNextCertificateId(store, 2026, "LA")).resolves.toBe(
      buildCertificateId(2026, "LA", 1),
    );
    await expect(assignNextCertificateId(store, 2026, "IA")).resolves.toBe(
      buildCertificateId(2026, "IA", 1),
    );
    await store.insert({
      ...DEMO_CERTIFICATE_INPUTS[0],
      certificateId: buildCertificateId(2026, "LA", 14),
    });
    await expect(assignNextCertificateId(store, 2026, "LA")).resolves.toBe(
      buildCertificateId(2026, "LA", 15),
    );
    await expect(assignNextCertificateId(store, 1999, "LA")).rejects.toThrow(
      /2000 to 2099/,
    );
  });
});

describe("surname check", () => {
  it("matches the last name and skips a blank surname", () => {
    expect(holderSurnameMatches("Sample Holder", "")).toBe(true);
    expect(holderSurnameMatches("Sample Holder", "  ")).toBe(true);
    expect(holderSurnameMatches("Sample Holder", "holder")).toBe(true);
    expect(holderSurnameMatches("Sample Holder", "Holder")).toBe(true);
    expect(holderSurnameMatches("Sample Holder", "Smith")).toBe(false);
    expect(holderSurnameMatches("Renée O'Brien", "obrien")).toBe(true);
  });
});

describe("public certificate", () => {
  it("returns only the fields shown on the verify page", () => {
    const record = {
      id: "secret-row",
      certificateId: DEMO_LEAD_AUDITOR_ID,
      holderFullName: "Sample Holder",
      course: "ISO 9001 Lead Auditor",
      trainingStart: "2026-01-06",
      trainingEnd: "2026-01-10",
      issueDate: "2026-01-12",
      status: "valid",
      createdAt: "2026-01-12T00:00:00.000Z",
      email: "hidden@example.com",
      phone: "+256700000000",
    } as CertificateRecord & { email: string; phone: string };
    const pub = toPublicCertificate(record);
    expect(Object.keys(pub).sort()).toEqual([...PUBLIC_KEYS].sort());
    expect(JSON.stringify(pub)).not.toContain("hidden@example.com");
    expect(JSON.stringify(pub)).not.toContain("+256700000000");
    expect(JSON.stringify(pub)).not.toContain("secret-row");
  });

  it("formats calendar dates without shifting the day", () => {
    expect(formatCertificateDate("2026-01-06")).toBe("6 Jan 2026");
  });
});

describe("lookup", () => {
  const store = createMemoryCertificateStore(DEMO_CERTIFICATE_INPUTS);

  it("shows a valid sample, a revoked sample, and a miss", async () => {
    const valid = await lookupCertificate(store, {
      certificateId: " nq 26 la 000 g ",
    });
    const revoked = await lookupCertificate(store, {
      certificateId: "nq26-ia-000-q",
    });
    const missingId = buildCertificateId(2026, "LA", 999);
    const missing = await lookupCertificate(store, { certificateId: missingId });
    expect(valid).toMatchObject({
      kind: "found",
      certificate: { holderName: "Sample Holder", status: "valid" },
    });
    expect(revoked).toMatchObject({
      kind: "found",
      certificate: { course: "ISO 45001 Internal Auditor", status: "revoked" },
    });
    expect(missing).toEqual({ kind: "not_found", certificateId: missingId });
  });

  it("rejects a bad check letter before looking up a holder", async () => {
    const result = await lookupCertificate(store, { certificateId: "NQ26LA000K" });
    expect(result).toEqual({ kind: "invalid_number" });
    expect(JSON.stringify(result)).not.toContain("Sample Holder");
    const odd = await lookupCertificate(store, { certificateId: "NQ26LA014K" });
    expect(odd.kind).toBe("invalid_number");
  });

  it("treats a wrong surname as not found", async () => {
    const result = await lookupCertificate(store, {
      certificateId: "nq26la000g",
      surname: "Smith",
    });
    expect(result.kind).toBe("not_found");
    expect(JSON.stringify(result)).not.toContain("Sample Holder");
  });

  it("removes only the sample rows", async () => {
    const local = createMemoryCertificateStore([
      ...DEMO_CERTIFICATE_INPUTS,
      {
        certificateId: buildCertificateId(2026, "LA", 1),
        holderFullName: "Sample Holder",
        course: "ISO 9001 Lead Auditor",
        trainingStart: "2026-03-02",
        trainingEnd: "2026-03-06",
        issueDate: "2026-03-06",
        status: "valid",
      },
    ]);
    expect(await removeDemoCertificates(local)).toBe(2);
    const left = await local.list();
    expect(left.map((row) => row.certificateId)).toEqual([buildCertificateId(2026, "LA", 1)]);
  });
});

describe("validation and csv", () => {
  it("rejects a training end before the start", () => {
    const result = validateCertificateInput({
      ...DEMO_CERTIFICATE_INPUTS[0],
      trainingEnd: "2026-01-01",
    });
    expect(result.ok).toBe(false);
  });

  it("imports the template and refuses a bad file without partial rows", () => {
    const ok = parseCertificateCsv(CERTIFICATE_CSV_TEMPLATE);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.rows).toHaveLength(1);

    const bad = parseCertificateCsv(
      [
        "certificate_id,holder_full_name,course,training_start,training_end,issue_date,status",
        `${buildCertificateId(2026, "LA", 2)},Sample Holder,ISO 9001 Lead Auditor,2026-01-06,2026-01-10,2026-01-12,valid`,
        `${buildCertificateId(2026, "LA", 2).toLowerCase().replace(/^(..)(..)(...)(...)$/, "$1-$2-$3-$4")},Sample Holder,ISO 9001 Lead Auditor,2026-01-06,2026-01-10,2026-01-12,valid`,
      ].join("\n"),
    );
    expect(bad.ok).toBe(false);
  });
});

describe("rate limit", () => {
  it("allows a short burst and then blocks", () => {
    expect(VERIFY_RATE_LIMIT).toBe(30);
    expect(VERIFY_RATE_WINDOW_MS).toBe(10 * 60 * 1000);
    const limiter = createRateLimiter(2, 1_000);
    expect(limiter.isLimited("1.2.3.4", 0)).toBe(false);
    expect(limiter.isLimited("1.2.3.4", 10)).toBe(false);
    expect(limiter.isLimited("1.2.3.4", 20)).toBe(true);
    expect(limiter.isLimited("1.2.3.4", 1_500)).toBe(false);
  });
});

describe("preview seed guard", () => {
  it("inserts sample rows only on a Vercel preview, never in production", () => {
    expect(demoSeedEnabled({ VERCEL_ENV: "preview" })).toBe(true);
    expect(demoSeedEnabled({ NODE_ENV: "production", VERCEL_ENV: "preview" })).toBe(true);
    expect(demoSeedEnabled({ VERCEL_ENV: "preview", CERTIFICATE_DEMO_SEED: "false" })).toBe(
      false,
    );
    expect(demoSeedEnabled({ VERCEL_ENV: "production" })).toBe(false);
    expect(demoSeedEnabled({ VERCEL_ENV: "production", CERTIFICATE_DEMO_SEED: "true" })).toBe(
      false,
    );
    expect(
      demoSeedEnabled({
        NODE_ENV: "production",
        VERCEL: "1",
        VERCEL_ENV: "production",
        CERTIFICATE_DEMO_SEED: "true",
      }),
    ).toBe(false);
    expect(demoSeedEnabled({ NODE_ENV: "production", CERTIFICATE_DEMO_SEED: "true" })).toBe(
      false,
    );
    expect(demoSeedEnabled({ CERTIFICATE_DEMO_SEED: "true" })).toBe(false);
    expect(demoSeedEnabled({})).toBe(false);

    expect(
      localMemoryCertificateStore({
        NODE_ENV: "development",
        CERTIFICATE_STORE: "memory",
      }),
    ).toBe(true);
    expect(
      localMemoryCertificateStore({
        NODE_ENV: "production",
        CERTIFICATE_STORE: "memory",
      }),
    ).toBe(false);
    expect(
      localMemoryCertificateStore({
        NODE_ENV: "development",
        CERTIFICATE_STORE: "memory",
        VERCEL: "1",
      }),
    ).toBe(false);
    expect(
      localMemoryCertificateStore({
        NODE_ENV: "development",
        CERTIFICATE_STORE: "memory",
        VERCEL_ENV: "preview",
      }),
    ).toBe(false);
  });
});

describe("qr helper", () => {
  it("encodes only the verify link", async () => {
    const url = certificateVerifyUrl(
      "https://www.amqualitysystems.com/",
      DEMO_LEAD_AUDITOR_ID,
    );
    expect(url).toBe(`https://amqualitysystems.com/verify?id=${DEMO_LEAD_AUDITOR_ID}`);
    expect(
      certificateVerifyUrl("https://preview.example.com", DEMO_LEAD_AUDITOR_ID),
    ).toBe(`https://preview.example.com/verify?id=${DEMO_LEAD_AUDITOR_ID}`);
    expect(certificateVerifyUrl("http://localhost:3000/", DEMO_INTERNAL_AUDITOR_ID)).toBe(
      `http://localhost:3000/verify?id=${DEMO_INTERNAL_AUDITOR_ID}`,
    );
    const svg = await certificateQrSvg(url);
    expect(svg).toContain("<svg");
    expect(svg).not.toContain("Sample Holder");
    const png = await certificateQrPng(url);
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(
      requestPublicOrigin({
        url: "http://localhost:3000/api/admin/certificates/qr",
        headers: {
          get(name: string) {
            if (name === "x-forwarded-host") return "preview.example.com";
            if (name === "x-forwarded-proto") return "https";
            return null;
          },
        },
      }),
    ).toBe("https://preview.example.com");
  });
});

describe("certificate copy and database rules", () => {
  const files = [
    "app/verify/[[...certificateId]]/page.tsx",
    "app/verify/shell.tsx",
    "app/verify/result.tsx",
    "app/admin/certificates/editor.tsx",
    "lib/certificates.ts",
    "db/certificates.sql",
  ];

  it("calls them certificates of completion and does not claim accreditation", () => {
    const combined = files.map(source).join("\n");
    expect(combined).toContain(VERIFY_PAGE_TITLE);
    expect(combined).toContain("certificate of completion");
    expect(combined).toContain(CERTIFICATE_DISCLAIMER);
    expect(combined).not.toMatch(/\bIRCA\b/);
    expect(combined).not.toMatch(/\bExemplar\b/i);
    expect(combined).not.toMatch(/\baccredit/i);
    expect(combined).not.toMatch(/NAM QMS certifies/i);
    expect(source("app/verify/shell.tsx")).toContain("VERIFY_PAGE_TITLE");
    expect(source("app/components/Footer.tsx")).toContain('href: "/verify"');
  });

  it("keeps the table closed to anonymous reads", () => {
    const sql = source("db/certificates.sql");
    expect(sql).toContain("revoke all on table public.certificates from anon, authenticated");
    expect(sql).toContain(DEMO_LEAD_AUDITOR_ID);
    expect(sql).toContain(DEMO_INTERNAL_AUDITOR_ID);
    expect(sql).toContain("NAMQMS/TRN/2026/DEMO1");
    expect(sql).toContain("NAMQMS-DEMO-0001");
    expect(sql).toContain(
      "check (certificate_id ~ '^NQ[0-9]{2}(LA|IA)[0-9]{3}[ABCDEFGHJKLMNPQRSTVWXYZ]$')",
    );
    expect(sql).not.toMatch(/create policy/i);
    expect(sql).not.toMatch(/\bemail\b/i);
    expect(sql).not.toMatch(/\bphone\b/i);
  });
});
