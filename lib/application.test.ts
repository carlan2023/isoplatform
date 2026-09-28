import { describe, it, expect } from "vitest";
import {
  validateApplication,
  isHoneypotTripped,
  generateReference,
  buildStaffEmail,
  buildApplicantEmail,
  standardFromSlug,
  HONEYPOT_FIELD,
  MAX_SHORT,
  type IsoApplication,
} from "./application";

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    fullName: "  Jane Nakato ",
    jobTitle: "Quality Manager",
    email: "Jane@Example.com ",
    phone: "+256 700 123456",
    legalName: "Acme Uganda Ltd",
    tradingName: "Acme",
    address: "Plot 1, Kampala Road",
    city: "Kampala",
    country: "",
    website: "acme.ug",
    industry: "Manufacturing",
    registrationNumber: "1000123456",
    standards: ["ISO 9001", "ISO 14001", "Bogus"],
    otherStandard: "",
    scope: "Manufacture and distribution of bottled water.",
    siteCount: "2",
    siteAddresses: "Site A\nSite B",
    outsourcedProcesses: "Transport",
    totalEmployees: "120",
    fullTimeEmployees: 100,
    partTimeEmployees: "20",
    shifts: "2",
    serviceNeeded: "Consulting / implementation",
    certificationType: "Initial certification",
    currentStatus: "Partially implemented",
    currentCertificationBody: "",
    targetDate: "2027-03-01",
    referralSource: "LinkedIn",
    notes: "",
    consent: true,
    ...overrides,
  };
}

function validData(overrides: Record<string, unknown> = {}): IsoApplication {
  const r = validateApplication(validInput(overrides));
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.data;
}

describe("validateApplication", () => {
  it("accepts a valid application, trimming and coercing values", () => {
    const r = validateApplication(validInput());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.fullName).toBe("Jane Nakato");
    expect(r.data.email).toBe("jane@example.com");
    expect(r.data.country).toBe("Uganda");
    expect(r.data.standards).toEqual(["ISO 9001", "ISO 14001"]);
    expect(r.data.siteCount).toBe(2);
    expect(r.data.totalEmployees).toBe(120);
    expect(r.data.fullTimeEmployees).toBe(100);
    expect(r.data.partTimeEmployees).toBe(20);
    expect(r.data.shifts).toBe(2);
    expect(r.data.consent).toBe(true);
  });

  it("treats blank optional counts as null", () => {
    const data = validData({ fullTimeEmployees: "", partTimeEmployees: undefined });
    expect(data.fullTimeEmployees).toBeNull();
    expect(data.partTimeEmployees).toBeNull();
  });

  it("rejects non-object input", () => {
    expect(validateApplication(null).ok).toBe(false);
    expect(validateApplication("x").ok).toBe(false);
    expect(validateApplication([]).ok).toBe(false);
  });

  it("reports every missing required field", () => {
    const r = validateApplication({});
    expect(r.ok).toBe(false);
    if (r.ok) return;
    for (const f of [
      "fullName",
      "email",
      "phone",
      "legalName",
      "address",
      "city",
      "industry",
      "standards",
      "scope",
      "siteCount",
      "totalEmployees",
      "serviceNeeded",
      "certificationType",
      "currentStatus",
      "consent",
    ]) {
      expect(r.errors[f], f).toBeTruthy();
    }
    expect(r.errors.jobTitle).toBeUndefined();
    expect(r.errors.website).toBeUndefined();
  });

  it("rejects a bad email", () => {
    for (const email of ["nope", "a@b", "a b@c.com", "<x>@y.com"]) {
      const r = validateApplication(validInput({ email }));
      expect(r.ok, email).toBe(false);
      if (!r.ok) expect(r.errors.email).toMatch(/valid email/i);
    }
  });

  it("requires at least one allowed standard", () => {
    for (const standards of [[], ["ISO 99999"], "ISO 9001", undefined]) {
      const r = validateApplication(validInput({ standards }));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors.standards).toBeTruthy();
    }
  });

  it("requires a description when 'Other' is selected", () => {
    const r = validateApplication(validInput({ standards: ["Other"] }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.otherStandard).toBeTruthy();
    expect(validData({ standards: ["Other"], otherStandard: "ISO 50001" }).otherStandard).toBe(
      "ISO 50001",
    );
  });

  it("rejects negative, fractional and non-numeric counts", () => {
    for (const v of ["-1", "2.5", "abc", -3]) {
      const r = validateApplication(validInput({ fullTimeEmployees: v }));
      expect(r.ok, String(v)).toBe(false);
      if (!r.ok) expect(r.errors.fullTimeEmployees).toBeTruthy();
    }
    const zeroSites = validateApplication(validInput({ siteCount: 0 }));
    expect(zeroSites.ok).toBe(false);
  });

  it("flags full-time + part-time exceeding the total", () => {
    const r = validateApplication(
      validInput({ totalEmployees: 10, fullTimeEmployees: 8, partTimeEmployees: 5 }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.totalEmployees).toBeTruthy();
  });

  it("rejects options outside the allowed lists", () => {
    const r = validateApplication(validInput({ serviceNeeded: "Free stuff" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.serviceNeeded).toBeTruthy();
  });

  it("requires consent", () => {
    const r = validateApplication(validInput({ consent: false }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.consent).toBeTruthy();
  });

  it("caps string lengths", () => {
    const data = validData({ jobTitle: "x".repeat(MAX_SHORT + 50) });
    expect(data.jobTitle.length).toBe(MAX_SHORT);
  });
});

describe("isHoneypotTripped", () => {
  it("detects a filled honeypot field", () => {
    expect(isHoneypotTripped(validInput({ [HONEYPOT_FIELD]: "http://spam" }))).toBe(true);
  });
  it("ignores empty / absent honeypot", () => {
    expect(isHoneypotTripped(validInput())).toBe(false);
    expect(isHoneypotTripped(validInput({ [HONEYPOT_FIELD]: "  " }))).toBe(false);
    expect(isHoneypotTripped(null)).toBe(false);
  });
});

describe("standardFromSlug", () => {
  it("maps certification slugs to standards", () => {
    expect(standardFromSlug("iso-27001")).toBe("ISO 27001");
    expect(standardFromSlug("pci-dss")).toBe("PCI DSS");
    expect(standardFromSlug("ISO 9001")).toBe("ISO 9001");
  });
  it("returns null for unknown values", () => {
    expect(standardFromSlug("iso-99999")).toBeNull();
    expect(standardFromSlug("other")).toBeNull();
    expect(standardFromSlug(undefined)).toBeNull();
  });
});

describe("generateReference", () => {
  it("formats NAM-APP-YYYYMMDD-XXXX", () => {
    const ref = generateReference(new Date(Date.UTC(2026, 8, 28)));
    expect(ref).toMatch(/^NAM-APP-20260928-[A-Z2-9]{4}$/);
  });
});

describe("emails", () => {
  it("staff email contains every section, the reference and the subject format", () => {
    const data = validData();
    const email = buildStaffEmail(data, "NAM-APP-20260928-ABCD");
    expect(email.subject).toBe("New ISO Application — ISO 9001, ISO 14001 — Acme Uganda Ltd (Acme)");
    expect(email.html).toContain("NAM-APP-20260928-ABCD");
    for (const label of [
      "1. Contact",
      "2. Organisation",
      "3. Certification scope",
      "4. Workforce",
      "5. Current status",
      "6. Anything else",
      "Job title",
      "TIN / registration no.",
      "Outsourced processes",
      "Number of shifts",
      "How they heard about us",
    ]) {
      expect(email.html).toContain(label);
    }
    expect(email.html).toContain("Site A<br/>Site B");
    expect(email.text).toContain("Quality Manager");
  });

  it("escapes HTML in user-supplied values", () => {
    const data = validData({
      legalName: '<script>alert("x")</script>',
      notes: "<img src=x onerror=alert(1)>",
    });
    const staff = buildStaffEmail(data, "REF");
    const applicant = buildApplicantEmail(data, "REF");
    for (const html of [staff.html, applicant.html]) {
      expect(html).not.toContain("<script>");
      expect(html).not.toContain("<img");
      expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    }
  });

  it("applicant email thanks them, summarises and gives next steps", () => {
    const data = validData();
    const email = buildApplicantEmail(data, "NAM-APP-20260928-ABCD");
    expect(email.subject).toContain("NAM-APP-20260928-ABCD");
    expect(email.html).toContain("Thank you, Jane");
    expect(email.html).toContain("2 business days");
    expect(email.html).toContain("wa.me");
    expect(email.html).toContain("Acme Uganda Ltd");
  });
});
