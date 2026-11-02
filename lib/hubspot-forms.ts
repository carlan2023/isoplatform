// ---------------------------------------------------------------------------
// HubSpot Forms API (portal 149517164, EU1).
//
// Enquiry and application forms on this site are posted here after they pass
// validation, in addition to the staff email.
//
//   HUBSPOT_CONSULT_FORM_ID   free consultation / contact enquiry.
//                             Defaults to the form already embedded on the
//                             HubSpot landing page (portal 149517164).
//   HUBSPOT_APPLY_FORM_ID     /apply certification application. No form
//                             exists for this yet; until the id is set, the
//                             application is emailed and not sent to HubSpot.
//
// Optional HUBSPOT_PRIVATE_APP_TOKEN sends the submission to the secure
// endpoint. Without it the public Forms endpoint is used, which works for a
// form that is not marked private.
//
// Each form in HubSpot needs these internal names (blank values are omitted):
//   email, firstname, lastname, phone, company, message
// The application form may also include jobtitle, website, address, city and
// country. Fields the form does not contain are dropped and the submit is
// retried. email and message carry the detail either way. message is where
// the standard, scope and reference are written, so a form does not need a
// custom property for each question.
// ---------------------------------------------------------------------------

import { HUBSPOT_PORTAL_ID } from "./hubspot";
import type { IsoApplication } from "./application";

export type HubSpotField = { name: string; value: string };

export type HubSpotPageContext = {
  hutk?: string;
  pageUri?: string;
  pageName?: string;
};

export type HubSpotSubmitResult =
  | { ok: true; attempts: number }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped?: false; status: number; reason: string };

const PUBLIC_SUBMIT =
  "https://api.hsforms.com/submissions/v3/integration/submit";
const SECURE_SUBMIT =
  "https://api.hsforms.com/submissions/v3/integration/secure/submit";

/** Form embedded on the existing HubSpot landing page for this portal. */
export const HUBSPOT_CONSULT_FORM_ID_DEFAULT =
  "e898837c-ac57-4153-81f5-48d863b668dd";

export function hubSpotConsultFormId(): string {
  return optionalEnv("HUBSPOT_CONSULT_FORM_ID") ?? HUBSPOT_CONSULT_FORM_ID_DEFAULT;
}

export function hubSpotApplyFormId(): string | undefined {
  return optionalEnv("HUBSPOT_APPLY_FORM_ID");
}

export function hubSpotPrivateAppToken(): string | undefined {
  return optionalEnv("HUBSPOT_PRIVATE_APP_TOKEN");
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function hubSpotFormsEndpoint(formId: string, token?: string | null): string {
  const base = token ? SECURE_SUBMIT : PUBLIC_SUBMIT;
  return `${base}/${HUBSPOT_PORTAL_ID}/${encodeURIComponent(formId)}`;
}

export function splitPersonName(fullName: string): {
  firstname: string;
  lastname: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstname: "", lastname: "" };
  if (parts.length === 1) return { firstname: parts[0], lastname: "" };
  return { firstname: parts[0], lastname: parts.slice(1).join(" ") };
}

/** Drop blank values. HubSpot rejects an empty string on some fields. */
export function hubSpotFields(
  pairs: Record<string, string | null | undefined>,
): HubSpotField[] {
  const fields: HubSpotField[] = [];
  for (const [name, raw] of Object.entries(pairs)) {
    const value = (raw ?? "").trim();
    if (!value) continue;
    fields.push({ name, value });
  }
  return fields;
}

export function consultHubSpotFields(input: {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  standard: string;
  message: string;
}): HubSpotField[] {
  const { firstname, lastname } = splitPersonName(input.name);
  return hubSpotFields({
    email: input.email,
    firstname,
    lastname,
    company: input.company,
    phone: input.phone,
    message: `Standard: ${input.standard}\n\n${input.message}`,
  });
}

export function applyHubSpotFields(
  data: IsoApplication,
  reference: string,
): HubSpotField[] {
  const { firstname, lastname } = splitPersonName(data.fullName);
  const standards = data.standards.join(", ");
  const lines = [
    `Reference: ${reference}`,
    `Organisation: ${data.legalName}`,
    data.tradingName ? `Trading name: ${data.tradingName}` : "",
    `Job title: ${data.jobTitle}`,
    `Standards: ${standards}${data.otherStandard ? ` (${data.otherStandard})` : ""}`,
    `Service: ${data.serviceNeeded}`,
    `Certification type: ${data.certificationType}`,
    `Current status: ${data.currentStatus}`,
    data.currentCertificationBody
      ? `Current certification body: ${data.currentCertificationBody}`
      : "",
    `Sites: ${data.siteCount}`,
    data.siteAddresses ? `Site addresses: ${data.siteAddresses}` : "",
    `Employees: ${data.totalEmployees}`,
    `Scope: ${data.scope}`,
    data.outsourcedProcesses
      ? `Outsourced processes: ${data.outsourcedProcesses}`
      : "",
    data.targetDate ? `Target date: ${data.targetDate}` : "",
    data.referralSource ? `Heard about us: ${data.referralSource}` : "",
    data.industry ? `Industry: ${data.industry}` : "",
    data.registrationNumber
      ? `Registration number: ${data.registrationNumber}`
      : "",
    data.notes ? `Notes: ${data.notes}` : "",
    "Consent to be contacted: yes",
  ];
  return hubSpotFields({
    email: data.email,
    firstname,
    lastname,
    phone: data.phone,
    company: data.tradingName || data.legalName,
    jobtitle: data.jobTitle,
    website: data.website,
    address: data.address,
    city: data.city,
    country: data.country,
    message: lines.filter(Boolean).join("\n"),
  });
}

export function pageContextFrom(input: {
  pageUri?: unknown;
  pageName?: unknown;
  referer?: string | null;
  hutk?: string | null;
}): HubSpotPageContext {
  const pageUri = httpUrl(input.pageUri) ?? httpUrl(input.referer);
  const pageName =
    typeof input.pageName === "string" ? input.pageName.trim().slice(0, 200) : "";
  const hutk = typeof input.hutk === "string" ? input.hutk.trim() : "";
  return {
    ...(hutk ? { hutk } : {}),
    ...(pageUri ? { pageUri } : {}),
    ...(pageName ? { pageName } : {}),
  };
}

function httpUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, 2000);
  if (!/^https?:\/\//i.test(trimmed)) return undefined;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function fieldsRejectedByHubSpot(body: unknown): string[] {
  if (!body || typeof body !== "object") return [];
  const errors = (body as { errors?: unknown }).errors;
  if (!Array.isArray(errors)) return [];
  const names = new Set<string>();
  for (const err of errors) {
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message?: unknown }).message ?? "")
        : "";
    const dotted = message.match(/fields\.([A-Za-z0-9_]+)/);
    if (dotted) names.add(dotted[1]);
    if (/field/i.test(message)) {
      const quoted = message.match(/'([A-Za-z0-9_]+)'/);
      if (quoted) names.add(quoted[1]);
    }
  }
  return [...names];
}

export function hubSpotRequiresConsent(body: unknown): boolean {
  const text = JSON.stringify(body ?? "").toLowerCase();
  return (
    text.includes("legalconsentoptions") ||
    text.includes("legal consent") ||
    text.includes("consenttoprocess")
  );
}

const CONSENT_TEXT =
  "I agree that NAM QMS may store these details and contact me about this request.";

type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

export async function submitHubSpotForm(
  input: {
    formId: string | undefined | null;
    fields: HubSpotField[];
    context?: HubSpotPageContext;
    /** When the form id is missing, this is the env var name to mention. */
    missingEnvName: string;
  },
  deps?: { fetch?: FetchLike; token?: string | null },
): Promise<HubSpotSubmitResult> {
  const formId = input.formId?.trim();
  if (!formId) {
    return {
      ok: false,
      skipped: true,
      reason: `${input.missingEnvName} is not set`,
    };
  }

  const token = deps?.token ?? hubSpotPrivateAppToken() ?? null;
  const fetchImpl = deps?.fetch ?? fetch;
  let fields = input.fields.filter((field) => field.value.trim() !== "");
  let withConsent = false;
  let lastStatus = 0;
  let lastReason = "HubSpot rejected the submission.";

  for (let attempt = 1; attempt <= 3; attempt++) {
    const payload: Record<string, unknown> = {
      fields,
      context: {
        ...(input.context?.hutk ? { hutk: input.context.hutk } : {}),
        ...(input.context?.pageUri ? { pageUri: input.context.pageUri } : {}),
        ...(input.context?.pageName ? { pageName: input.context.pageName } : {}),
      },
    };
    if (withConsent) {
      payload.legalConsentOptions = {
        consent: {
          consentToProcess: true,
          text: CONSENT_TEXT,
        },
      };
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    let response: Response;
    try {
      response = await fetchImpl(hubSpotFormsEndpoint(formId, token), {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "HubSpot request failed";
      return { ok: false, status: 0, reason };
    }

    if (response.ok) return { ok: true, attempts: attempt };

    lastStatus = response.status;
    const body: unknown = await response.json().catch(() => null);
    lastReason = hubSpotErrorReason(body) || `HubSpot responded ${response.status}`;

    const rejected = fieldsRejectedByHubSpot(body);
    const nextFields = fields.filter(
      (field) => field.name === "email" || !rejected.includes(field.name),
    );
    const dropped = nextFields.length < fields.length;
    const needsConsent = !withConsent && hubSpotRequiresConsent(body);
    if (!dropped && !needsConsent) break;
    if (dropped) fields = nextFields;
    if (needsConsent) withConsent = true;
    if (!fields.some((field) => field.name === "email")) break;
  }

  return { ok: false, status: lastStatus, reason: lastReason };
}

function hubSpotErrorReason(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const message = (body as { message?: unknown }).message;
  return typeof message === "string" ? message.slice(0, 300) : "";
}

export function logHubSpotResult(scope: string, result: HubSpotSubmitResult) {
  if (result.ok) return;
  if (result.skipped) {
    console.warn(
      `[hubspot] ${scope} was not submitted: ${result.reason}. Email was still sent.`,
    );
    return;
  }
  console.error(
    `[hubspot] ${scope} submission failed (${result.status}): ${result.reason}`,
  );
}
