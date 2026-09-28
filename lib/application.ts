// ---------------------------------------------------------------------------
// ISO certification application — validation + email templates.
//
// Pure, framework-free module used by POST /api/apply. Everything a
// certification body / consultant needs to prepare a quotation is captured,
// validated here, and rendered into:
//
//   buildStaffEmail(data, ref)     — full, sectioned breakdown for staff
//   buildApplicantEmail(data, ref) — thank-you + summary + next steps
//
// NOTE: this module imports lib/email (and therefore the Resend SDK), so do
// NOT import it from client components. The application form receives the
// option lists as props from the (server) /apply page instead.
//
// Relative imports are used (not "@/lib/...") so vitest can resolve them
// without a path alias.
// ---------------------------------------------------------------------------

import { escapeHtml } from "./email";
import { CONTACT, SITE_NAME, LEGAL_NAME } from "./site";
import { STANDARDS } from "./standards";

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------

export const STANDARD_OPTIONS = [
  "ISO 9001",
  "ISO 14001",
  "ISO 45001",
  "ISO 22000",
  "ISO 27001",
  "ISO 27701",
  "PCI DSS",
  "Other",
] as const;
export type StandardOption = (typeof STANDARD_OPTIONS)[number];

export const SERVICE_OPTIONS = [
  "Consulting / implementation",
  "Certification audit only",
  "Gap analysis only",
  "Training",
  "Not sure",
] as const;
export type ServiceOption = (typeof SERVICE_OPTIONS)[number];

export const CERTIFICATION_TYPE_OPTIONS = [
  "Initial certification",
  "Transfer from another body",
  "Recertification",
] as const;
export type CertificationTypeOption =
  (typeof CERTIFICATION_TYPE_OPTIONS)[number];

export const CURRENT_STATUS_OPTIONS = [
  "No system yet",
  "Partially implemented",
  "Fully implemented / ready for audit",
  "Currently certified",
] as const;
export type CurrentStatusOption = (typeof CURRENT_STATUS_OPTIONS)[number];

/** Bundle of option lists handed to the client form as a prop. */
export const APPLICATION_OPTIONS = {
  standards: STANDARD_OPTIONS,
  services: SERVICE_OPTIONS,
  certificationTypes: CERTIFICATION_TYPE_OPTIONS,
  currentStatuses: CURRENT_STATUS_OPTIONS,
};
export type ApplicationOptions = typeof APPLICATION_OPTIONS;

/** Hidden anti-spam field. Real users never see or fill it. */
export const HONEYPOT_FIELD = "website_url_confirm";

/** Length caps. */
export const MAX_SHORT = 200;
export const MAX_LONG = 5000;
const MAX_COUNT = 1_000_000;
const MAX_SHIFTS = 10;
const MAX_SITES = 10_000;

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

export interface IsoApplication {
  // 1. Contact
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  // 2. Organisation
  legalName: string;
  tradingName: string;
  address: string;
  city: string;
  country: string;
  website: string;
  industry: string;
  registrationNumber: string;
  // 3. Scope
  standards: StandardOption[];
  otherStandard: string;
  scope: string;
  siteCount: number;
  siteAddresses: string;
  outsourcedProcesses: string;
  // 4. Workforce
  totalEmployees: number;
  fullTimeEmployees: number | null;
  partTimeEmployees: number | null;
  shifts: number;
  // 5. Status
  serviceNeeded: ServiceOption;
  certificationType: CertificationTypeOption;
  currentStatus: CurrentStatusOption;
  currentCertificationBody: string;
  targetDate: string;
  referralSource: string;
  // 6. Anything else
  notes: string;
  consent: true;
}

export type ApplicationField = keyof IsoApplication;

export type ValidationResult =
  | { ok: true; data: IsoApplication }
  | { ok: false; errors: Record<string, string> };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

function str(value: unknown, max: number): string {
  if (typeof value !== "string" && typeof value !== "number") return "";
  // Collapse Windows newlines, strip control chars except \n and \t.
  return String(value)
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

type IntResult = { value: number | null; error?: string };

function int(value: unknown, min: number, max: number): IntResult {
  if (value === undefined || value === null) return { value: null };
  const raw = typeof value === "string" ? value.trim().replace(/,/g, "") : value;
  if (raw === "") return { value: null };
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return { value: null, error: "Enter a whole number." };
  }
  if (n < min) return { value: null, error: `Must be ${min} or more.` };
  if (n > max) return { value: null, error: `Must be ${max} or less.` };
  return { value: n };
}

function oneOf<T extends string>(
  value: unknown,
  options: readonly T[],
): T | null {
  return typeof value === "string" && (options as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

/** True when the hidden honeypot field has been filled in (i.e. a bot). */
export function isHoneypotTripped(input: unknown): boolean {
  if (!input || typeof input !== "object") return false;
  const v = (input as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof v === "string" ? v.trim() !== "" : Boolean(v);
}

/** Map a /certifications/<slug> slug (or a code like "ISO 9001") to an option. */
export function standardFromSlug(
  slug: string | undefined | null,
): StandardOption | null {
  if (!slug) return null;
  const s = slug.trim().toLowerCase();
  const byCode = STANDARD_OPTIONS.find((o) => o.toLowerCase() === s);
  if (byCode && byCode !== "Other") return byCode;
  const std = STANDARDS.find((x) => x.slug === s);
  return std ? oneOf(std.code, STANDARD_OPTIONS) : null;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateApplication(input: unknown): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: { form: "Invalid application." } };
  }
  const i = input as Record<string, unknown>;

  const required = (field: string, value: string, message: string) => {
    if (!value) errors[field] = message;
    return value;
  };

  // 1. Contact
  const fullName = required("fullName", str(i.fullName, MAX_SHORT), "Enter your full name.");
  const jobTitle = str(i.jobTitle, MAX_SHORT);
  const email = str(i.email, MAX_SHORT).toLowerCase();
  if (!email) errors.email = "Enter your email address.";
  else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  const phone = str(i.phone, 40);
  if (!phone) errors.phone = "Enter a phone number.";
  else if ((phone.match(/\d/g) ?? []).length < 7 || !/^[+\d\s().-]+$/.test(phone)) {
    errors.phone = "Enter a valid phone number.";
  }

  // 2. Organisation
  const legalName = required("legalName", str(i.legalName, MAX_SHORT), "Enter your organisation's legal name.");
  const tradingName = str(i.tradingName, MAX_SHORT);
  const address = required("address", str(i.address, 500), "Enter your physical address.");
  const city = required("city", str(i.city, MAX_SHORT), "Enter your city or town.");
  const country = str(i.country, MAX_SHORT) || "Uganda";
  const website = str(i.website, MAX_SHORT);
  const industry = required("industry", str(i.industry, MAX_SHORT), "Enter your industry or sector.");
  const registrationNumber = str(i.registrationNumber, MAX_SHORT);

  // 3. Scope
  const rawStandards = Array.isArray(i.standards) ? i.standards : [];
  const standards = STANDARD_OPTIONS.filter((o) => rawStandards.includes(o));
  if (standards.length === 0) errors.standards = "Select at least one standard.";
  const otherStandard = str(i.otherStandard, MAX_SHORT);
  if (standards.includes("Other") && !otherStandard) {
    errors.otherStandard = "Tell us which other standard you need.";
  }
  const scope = required("scope", str(i.scope, MAX_LONG), "Describe the scope you want certified.");
  const sites = int(i.siteCount, 1, MAX_SITES);
  if (sites.error) errors.siteCount = sites.error;
  else if (sites.value === null) errors.siteCount = "Enter the number of sites.";
  const siteAddresses = str(i.siteAddresses, MAX_LONG);
  const outsourcedProcesses = str(i.outsourcedProcesses, MAX_LONG);

  // 4. Workforce
  const total = int(i.totalEmployees, 1, MAX_COUNT);
  if (total.error) errors.totalEmployees = total.error;
  else if (total.value === null) errors.totalEmployees = "Enter your total number of employees.";
  const fullTime = int(i.fullTimeEmployees, 0, MAX_COUNT);
  if (fullTime.error) errors.fullTimeEmployees = fullTime.error;
  const partTime = int(i.partTimeEmployees, 0, MAX_COUNT);
  if (partTime.error) errors.partTimeEmployees = partTime.error;
  if (
    total.value !== null &&
    fullTime.value !== null &&
    partTime.value !== null &&
    fullTime.value + partTime.value > total.value
  ) {
    errors.totalEmployees =
      "Total employees should be at least full-time plus part-time.";
  }
  const shifts = int(i.shifts, 1, MAX_SHIFTS);
  if (shifts.error) errors.shifts = shifts.error;

  // 5. Status
  const serviceNeeded = oneOf(i.serviceNeeded, SERVICE_OPTIONS);
  if (!serviceNeeded) errors.serviceNeeded = "Choose the service you need.";
  const certificationType = oneOf(i.certificationType, CERTIFICATION_TYPE_OPTIONS);
  if (!certificationType) errors.certificationType = "Choose the certification type.";
  const currentStatus = oneOf(i.currentStatus, CURRENT_STATUS_OPTIONS);
  if (!currentStatus) errors.currentStatus = "Choose your current status.";
  const currentCertificationBody = str(i.currentCertificationBody, MAX_SHORT);
  const targetDate = str(i.targetDate, 100);
  const referralSource = str(i.referralSource, MAX_SHORT);

  // 6. Anything else
  const notes = str(i.notes, MAX_LONG);
  if (i.consent !== true && i.consent !== "true" && i.consent !== "on") {
    errors.consent = "Please agree to be contacted about your application.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      fullName,
      jobTitle,
      email,
      phone,
      legalName,
      tradingName,
      address,
      city,
      country,
      website,
      industry,
      registrationNumber,
      standards,
      otherStandard: standards.includes("Other") ? otherStandard : "",
      scope,
      siteCount: sites.value as number,
      siteAddresses,
      outsourcedProcesses,
      totalEmployees: total.value as number,
      fullTimeEmployees: fullTime.value,
      partTimeEmployees: partTime.value,
      shifts: shifts.value ?? 1,
      serviceNeeded: serviceNeeded as ServiceOption,
      certificationType: certificationType as CertificationTypeOption,
      currentStatus: currentStatus as CurrentStatusOption,
      currentCertificationBody,
      targetDate,
      referralSource,
      notes,
      consent: true,
    },
  };
}

// ---------------------------------------------------------------------------
// Reference number
// ---------------------------------------------------------------------------

// No 0/O/1/I to keep references easy to read out over the phone.
const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** e.g. NAM-APP-20260928-7KQ4 */
export function generateReference(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const bytes = new Uint8Array(4);
  globalThis.crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("");
  return `NAM-APP-${y}${m}${d}-${suffix}`;
}

// ---------------------------------------------------------------------------
// Email rendering
// ---------------------------------------------------------------------------

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

type Row = [label: string, value: string];
type Section = { title: string; rows: Row[] };

const NOT_PROVIDED = "—";

function show(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return NOT_PROVIDED;
  const s = String(value).trim();
  return s === "" ? NOT_PROVIDED : s;
}

function standardsList(data: IsoApplication): string {
  return data.standards
    .map((s) => (s === "Other" && data.otherStandard ? `Other (${data.otherStandard})` : s))
    .join(", ");
}

/** Every captured field, grouped exactly like the form. */
export function applicationSections(data: IsoApplication): Section[] {
  return [
    {
      title: "1. Contact",
      rows: [
        ["Full name", show(data.fullName)],
        ["Job title", show(data.jobTitle)],
        ["Email", show(data.email)],
        ["Phone", show(data.phone)],
      ],
    },
    {
      title: "2. Organisation",
      rows: [
        ["Legal name", show(data.legalName)],
        ["Trading name", show(data.tradingName)],
        ["Physical address", show(data.address)],
        ["City / town", show(data.city)],
        ["Country", show(data.country)],
        ["Website", show(data.website)],
        ["Industry / sector", show(data.industry)],
        ["TIN / registration no.", show(data.registrationNumber)],
      ],
    },
    {
      title: "3. Certification scope",
      rows: [
        ["Standards requested", show(standardsList(data))],
        ["Proposed scope", show(data.scope)],
        ["Number of sites", show(data.siteCount)],
        ["Site addresses", show(data.siteAddresses)],
        ["Outsourced processes", show(data.outsourcedProcesses)],
      ],
    },
    {
      title: "4. Workforce",
      rows: [
        ["Total employees", show(data.totalEmployees)],
        ["Full-time", show(data.fullTimeEmployees)],
        ["Part-time / temporary", show(data.partTimeEmployees)],
        ["Number of shifts", show(data.shifts)],
      ],
    },
    {
      title: "5. Current status",
      rows: [
        ["Service needed", show(data.serviceNeeded)],
        ["Certification type", show(data.certificationType)],
        ["Current status", show(data.currentStatus)],
        ["Existing certification body", show(data.currentCertificationBody)],
        ["Target certification date", show(data.targetDate)],
        ["How they heard about us", show(data.referralSource)],
      ],
    },
    {
      title: "6. Anything else",
      rows: [
        ["Additional notes", show(data.notes)],
        ["Consent to be contacted", data.consent ? "Yes" : "No"],
      ],
    },
  ];
}

/** Escape and keep line breaks. */
function htmlValue(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br/>");
}

const SANS = "font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;";

function sectionTableHtml(section: Section): string {
  const rows = section.rows
    .map(
      ([label, value]) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b; width: 38%; vertical-align: top;">${escapeHtml(label)}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569; vertical-align: top;">${htmlValue(value)}</td>
          </tr>`,
    )
    .join("");
  return `
      <h2 style="${SANS} font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; color: #0f766e; margin: 28px 0 8px;">${escapeHtml(section.title)}</h2>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; ${SANS} font-size: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px;">
        ${rows}
      </table>`;
}

function sectionsText(sections: Section[]): string {
  return sections
    .map(
      (s) =>
        `${s.title.toUpperCase()}\n` +
        s.rows.map(([label, value]) => `  ${label}: ${value.replace(/\n/g, "\n    ")}`).join("\n"),
    )
    .join("\n\n");
}

function shell(title: string, subtitle: string, body: string): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 680px; margin: 0 auto; padding: 32px 20px; color: #1e293b; background: #f8fafc;">
      <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 22px;">${title}</h1>
        <p style="margin: 8px 0 0; color: #64748b; ${SANS} font-size: 14px;">${subtitle}</p>
      </div>
      ${body}
    </div>`;
}

export function buildStaffEmail(data: IsoApplication, reference: string): BuiltEmail {
  const company = data.tradingName && data.tradingName !== data.legalName
    ? `${data.legalName} (${data.tradingName})`
    : data.legalName;
  // Subject is plain text (not HTML) — strip newlines only.
  const subject = `New ISO Application — ${data.standards
    .map((s) => (s === "Other" && data.otherStandard ? data.otherStandard : s))
    .join(", ")} — ${company}`.replace(/[\r\n]+/g, " ");

  const sections = applicationSections(data);
  const quick = `
      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; ${SANS} font-size: 14px; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px;">
        <tr><td style="padding: 12px 16px; color: #0f766e;">
          <strong>Reference:</strong> ${escapeHtml(reference)}<br/>
          <strong>Standards:</strong> ${escapeHtml(standardsList(data))}<br/>
          <strong>Employees:</strong> ${escapeHtml(String(data.totalEmployees))} &middot;
          <strong>Sites:</strong> ${escapeHtml(String(data.siteCount))} &middot;
          <strong>Shifts:</strong> ${escapeHtml(String(data.shifts))}<br/>
          <strong>Service:</strong> ${escapeHtml(data.serviceNeeded)} &middot; ${escapeHtml(data.certificationType)}<br/>
          <strong>Reply to:</strong> ${escapeHtml(data.fullName)} &lt;${escapeHtml(data.email)}&gt; &middot; ${escapeHtml(data.phone)}
        </td></tr>
      </table>`;

  const html = shell(
    "New ISO Certification Application",
    `${escapeHtml(SITE_NAME)} &middot; Ref ${escapeHtml(reference)} &middot; Prepare a quotation`,
    quick + sections.map(sectionTableHtml).join("") +
      `<p style="${SANS} font-size: 12px; color: #94a3b8; margin-top: 24px;">Reply to this email to respond directly to the applicant.</p>`,
  );

  const text =
    `New ISO certification application\nReference: ${reference}\n\n` +
    sectionsText(sections) +
    `\n\nReply to this email to respond directly to the applicant.\n`;

  return { subject, html, text };
}

export function buildApplicantEmail(data: IsoApplication, reference: string): BuiltEmail {
  const subject = `We received your ISO certification application (${reference})`;
  const sections = applicationSections(data);
  const firstName = data.fullName.split(/\s+/)[0] || data.fullName;

  const p = (content: string) =>
    `<p style="${SANS} font-size: 15px; line-height: 1.6; color: #475569;">${content}</p>`;

  const html = shell(
    `Thank you, ${escapeHtml(firstName)}`,
    `${escapeHtml(SITE_NAME)} &middot; Application reference <strong>${escapeHtml(reference)}</strong>`,
    p(
      `We have received your application for <strong>${escapeHtml(standardsList(data))}</strong> on behalf of <strong>${escapeHtml(data.legalName)}</strong>.`,
    ) +
      `<h2 style="${SANS} font-size: 16px; color: #1e293b; margin: 24px 0 8px;">What happens next</h2>
      <ol style="${SANS} font-size: 15px; line-height: 1.6; color: #475569; padding-left: 20px; margin: 0;">
        <li>Our team reviews your application and may contact you to clarify your scope.</li>
        <li>We send you a tailored quotation — typically within <strong>2 business days</strong>.</li>
        <li>Once you accept, we agree a plan and kick off your certification project.</li>
      </ol>` +
      p(
        `Questions in the meantime? Reply to this email or chat with us on WhatsApp at <a href="${escapeHtml(CONTACT.whatsapp)}" style="color: #0d9488;">${escapeHtml(CONTACT.phoneDisplay)}</a>. Please quote your reference <strong>${escapeHtml(reference)}</strong>.`,
      ) +
      `<h2 style="${SANS} font-size: 16px; color: #1e293b; margin: 28px 0 0;">Your application summary</h2>` +
      sections.map(sectionTableHtml).join("") +
      p(
        `Best regards,<br/><strong>${escapeHtml(SITE_NAME)}</strong><br/>A subsidiary of ${escapeHtml(LEGAL_NAME)}`,
      ),
  );

  const text =
    `Thank you, ${firstName}.\n\n` +
    `We have received your application (reference ${reference}) for ${standardsList(data)} on behalf of ${data.legalName}.\n\n` +
    `What happens next:\n` +
    `  1. Our team reviews your application and may contact you to clarify your scope.\n` +
    `  2. We send you a tailored quotation — typically within 2 business days.\n` +
    `  3. Once you accept, we agree a plan and kick off your certification project.\n\n` +
    `Questions? Reply to this email or WhatsApp us at ${CONTACT.phoneDisplay} (${CONTACT.whatsapp}).\n\n` +
    `YOUR APPLICATION SUMMARY\n\n${sectionsText(sections)}\n\n` +
    `Best regards,\n${SITE_NAME}\nA subsidiary of ${LEGAL_NAME}\n`;

  return { subject, html, text };
}
