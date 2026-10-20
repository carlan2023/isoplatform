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
  DEMO_CERTIFICATE_INPUTS,
  VERIFY_PAGE_TITLE,
  VERIFY_RATE_LIMIT,
  VERIFY_RATE_WINDOW_MS,
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
  it("accepts the human-readable form and the fake preview ids", () => {
    expect(normalizeCertificateId(" namqms-2026-la-0001 ")).toBe("NAMQMS-2026-LA-0001");
    expect(isCertificateId("NAMQMS-2026-LA-0001")).toBe(true);
    expect(isCertificateId("NAMQMS-DEMO-0001")).toBe(true);
    expect(isCertificateId("NAMQMS-DEMO-0002")).toBe(true);
    expect(isCertificateId("NAMQMS")).toBe(false);
    expect(isCertificateId("NAMQMS-%")).toBe(false);
    expect(isCertificateId("AMQMS-2026-LA-0001")).toBe(false);
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
      certificateId: "NAMQMS-DEMO-0001",
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
    const valid = await lookupCertificate(store, { certificateId: "namqms-demo-0001" });
    const revoked = await lookupCertificate(store, { certificateId: "NAMQMS-DEMO-0002" });
    const missing = await lookupCertificate(store, { certificateId: "NAMQMS-DEMO-9999" });
    expect(valid).toMatchObject({
      kind: "found",
      certificate: { holderName: "Sample Holder", status: "valid" },
    });
    expect(revoked).toMatchObject({
      kind: "found",
      certificate: { course: "ISO 45001 Internal Auditor", status: "revoked" },
    });
    expect(missing).toEqual({ kind: "not_found", certificateId: "NAMQMS-DEMO-9999" });
  });

  it("treats a wrong surname as not found", async () => {
    const result = await lookupCertificate(store, {
      certificateId: "NAMQMS-DEMO-0001",
      surname: "Smith",
    });
    expect(result.kind).toBe("not_found");
    expect(JSON.stringify(result)).not.toContain("Sample Holder");
  });

  it("removes only the sample rows", async () => {
    const local = createMemoryCertificateStore([
      ...DEMO_CERTIFICATE_INPUTS,
      {
        certificateId: "NAMQMS-2026-LA-0001",
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
    expect(left.map((row) => row.certificateId)).toEqual(["NAMQMS-2026-LA-0001"]);
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
        "NAMQMS-2026-LA-0002,Sample Holder,ISO 9001 Lead Auditor,2026-01-06,2026-01-10,2026-01-12,valid",
        "NAMQMS-2026-LA-0002,Sample Holder,ISO 9001 Lead Auditor,2026-01-06,2026-01-10,2026-01-12,valid",
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
  it("seeds only outside production, and only in memory for local development", () => {
    expect(demoSeedEnabled({ VERCEL_ENV: "preview" })).toBe(true);
    expect(demoSeedEnabled({ VERCEL_ENV: "production", CERTIFICATE_DEMO_SEED: "true" })).toBe(
      false,
    );
    expect(demoSeedEnabled({ CERTIFICATE_DEMO_SEED: "true" })).toBe(true);
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
      "NAMQMS-DEMO-0001",
    );
    expect(url).toBe("https://www.amqualitysystems.com/verify/NAMQMS-DEMO-0001");
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
    "app/verify/page.tsx",
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
    expect(sql).not.toMatch(/create policy/i);
    expect(sql).not.toMatch(/\bemail\b/i);
    expect(sql).not.toMatch(/\bphone\b/i);
  });
});
