import { afterEach, describe, expect, it, vi } from "vitest";
import type { IsoApplication } from "./application";
import { HUBSPOT_PORTAL_ID } from "./hubspot";
import {
  applyHubSpotFields,
  consultHubSpotFields,
  fieldsRejectedByHubSpot,
  hubSpotFields,
  HUBSPOT_CONSULT_FORM_ID_DEFAULT,
  hubSpotConsultFormId,
  hubSpotFormsEndpoint,
  hubSpotRequiresConsent,
  pageContextFrom,
  splitPersonName,
  submitHubSpotForm,
} from "./hubspot-forms";

const application = {
  fullName: "Amina Nakato",
  jobTitle: "Quality manager",
  email: "amina@example.com",
  phone: "+256700000000",
  legalName: "Nakato Foods Ltd",
  tradingName: "",
  address: "Plot 1, Kampala",
  city: "Kampala",
  country: "Uganda",
  website: "",
  industry: "Food",
  registrationNumber: "",
  standards: ["ISO 9001"],
  otherStandard: "",
  scope: "Processing",
  siteCount: 1,
  siteAddresses: "",
  outsourcedProcesses: "",
  totalEmployees: 40,
  fullTimeEmployees: null,
  partTimeEmployees: null,
  shifts: 1,
  serviceNeeded: "Consulting / implementation",
  certificationType: "Initial certification",
  currentStatus: "No system yet",
  currentCertificationBody: "",
  targetDate: "",
  referralSource: "",
  notes: "",
  consent: true,
} satisfies IsoApplication;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("HubSpot form payloads", () => {
  it("splits a person's name and omits blank fields", () => {
    expect(splitPersonName("Amina Nakato")).toEqual({
      firstname: "Amina",
      lastname: "Nakato",
    });
    expect(splitPersonName("Amina")).toEqual({
      firstname: "Amina",
      lastname: "",
    });
    expect(hubSpotFields({ email: "a@b.co", phone: "  ", company: "" })).toEqual([
      { name: "email", value: "a@b.co" },
    ]);
  });

  it("puts the standard and the full application into message", () => {
    const consult = consultHubSpotFields({
      name: "Amina Nakato",
      email: "amina@example.com",
      company: "Nakato Foods",
      phone: "",
      standard: "ISO 9001 — Quality Management",
      message: "We supply schools.",
    });
    expect(consult.find((field) => field.name === "phone")).toBeUndefined();
    expect(consult.find((field) => field.name === "message")?.value).toContain(
      "ISO 9001 — Quality Management",
    );
    expect(consult.find((field) => field.name === "message")?.value).toContain(
      "We supply schools.",
    );

    const apply = applyHubSpotFields(application, "NAM-APP-20261102-TEST");
    const message = apply.find((field) => field.name === "message")?.value ?? "";
    expect(message).toContain("NAM-APP-20261102-TEST");
    expect(message).toContain("ISO 9001");
    expect(message).toContain("Consent to be contacted: yes");
    expect(apply.find((field) => field.name === "company")?.value).toBe(
      "Nakato Foods Ltd",
    );
    expect(apply.find((field) => field.name === "website")).toBeUndefined();
  });

  it("keeps page context on http(s) urls and the hubspotutk cookie", () => {
    expect(
      pageContextFrom({
        pageUri: "javascript:alert(1)",
        referer: "https://www.amqualitysystems.com/free-consultation?ref=ad",
        pageName: "Book a free consultation",
        hutk: "abc123",
      }),
    ).toEqual({
      hutk: "abc123",
      pageUri: "https://www.amqualitysystems.com/free-consultation?ref=ad",
      pageName: "Book a free consultation",
    });
  });

  it("builds the EU1 forms endpoint and uses the secure path with a token", () => {
    expect(hubSpotFormsEndpoint("form-1", null)).toBe(
      `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/form-1`,
    );
    expect(hubSpotFormsEndpoint("form-1", "token")).toContain("/secure/submit/");
  });
});

describe("HubSpot form ids", () => {
  it("uses the existing consultation form unless the env overrides it", () => {
    vi.stubEnv("HUBSPOT_CONSULT_FORM_ID", "");
    expect(hubSpotConsultFormId()).toBe(HUBSPOT_CONSULT_FORM_ID_DEFAULT);
    expect(HUBSPOT_CONSULT_FORM_ID_DEFAULT).toBe(
      "e898837c-ac57-4153-81f5-48d863b668dd",
    );
    vi.stubEnv("HUBSPOT_CONSULT_FORM_ID", "custom-form");
    expect(hubSpotConsultFormId()).toBe("custom-form");
  });
});

describe("submitHubSpotForm", () => {
  it("skips the request when the form id is not configured", async () => {
    const fetchImpl = vi.fn();
    const result = await submitHubSpotForm(
      {
        formId: "",
        missingEnvName: "HUBSPOT_CONSULT_FORM_ID",
        fields: [{ name: "email", value: "a@b.co" }],
      },
      { fetch: fetchImpl },
    );
    expect(result).toEqual({
      ok: false,
      skipped: true,
      reason: "HUBSPOT_CONSULT_FORM_ID is not set",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("drops fields the form does not contain and retries", async () => {
    const bodies: unknown[] = [];
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)));
      if (bodies.length === 1) {
        return Response.json(
          {
            message: "The request is not valid",
            errors: [
              {
                message:
                  "Error in 'fields.jobtitle'. Field 'jobtitle' does not exist",
              },
            ],
          },
          { status: 400 },
        );
      }
      return Response.json({ inlineMessage: "Thanks" }, { status: 200 });
    });

    const result = await submitHubSpotForm(
      {
        formId: "form-1",
        missingEnvName: "HUBSPOT_APPLY_FORM_ID",
        fields: [
          { name: "email", value: "a@b.co" },
          { name: "jobtitle", value: "Manager" },
        ],
      },
      { fetch: fetchImpl, token: null },
    );

    expect(result).toEqual({ ok: true, attempts: 2 });
    expect(bodies[1]).toMatchObject({
      fields: [{ name: "email", value: "a@b.co" }],
    });
    expect(fieldsRejectedByHubSpot({
      errors: [{ message: "Error in 'fields.jobtitle'." }],
    })).toContain("jobtitle");
  });

  it("retries with legal consent when HubSpot asks for it", async () => {
    const bodies: Array<{ legalConsentOptions?: unknown }> = [];
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)));
      if (!bodies[0].legalConsentOptions && bodies.length === 1) {
        return Response.json(
          { message: "This form requires legalConsentOptions" },
          { status: 400 },
        );
      }
      return Response.json({ inlineMessage: "Thanks" }, { status: 200 });
    });

    const result = await submitHubSpotForm(
      {
        formId: "form-1",
        missingEnvName: "HUBSPOT_CONSULT_FORM_ID",
        fields: [{ name: "email", value: "a@b.co" }],
      },
      { fetch: fetchImpl, token: "private-token" },
    );

    expect(result.ok).toBe(true);
    expect(bodies[1].legalConsentOptions).toBeTruthy();
    expect(hubSpotRequiresConsent({ message: "legalConsentOptions required" })).toBe(
      true,
    );
    expect(hubSpotRequiresConsent({ message: "Form not found" })).toBe(false);
    const init = fetchImpl.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer private-token",
    );
  });
});
