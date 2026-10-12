// ---------------------------------------------------------------------------
// Internal Auditor Courses — company group enrollment.
//
// The company chooses how many people are coming (capped by MAX_TEAM_SIZE)
// and enters each participant's name and email. The amount charged is always
// computePricing(..., "internal-auditor").fullAmount: UGX 40,000 per person,
// or UGX 20,000 per person for groups of 5 or more. That total is collected
// in one Mobile Money payment.
// ---------------------------------------------------------------------------

import { normalizeUgandaMobile } from "./phone";
import {
  computePricing,
  isCollectableUgx,
  MAX_TEAM_SIZE,
  MOMO_MAX_AMOUNT,
  MOMO_MIN_AMOUNT,
  type PricingProduct,
} from "./pricing";
import { cleanString, isValidEmail } from "./validation";

export const INTERNAL_AUDITOR_PRODUCT: PricingProduct = "internal-auditor";
export const INTERNAL_AUDITOR_COURSE_TITLE = "Internal Auditor Courses";
export const INTERNAL_AUDITOR_ENROLL_PATH = "/internal-auditor-courses";

/** Hidden field. Humans never see it; a non-empty value means a bot. */
export const GROUP_HONEYPOT_FIELD = "website_url_confirm";

const MAX_NAME = 120;
const MAX_COMPANY = 160;

export type GroupParticipant = { name: string; email: string };

export type GroupEnrollmentInput = {
  companyName: string;
  contactName: string;
  contactEmail: string;
  momoPhone: string;
  participantCount: number;
  participants: GroupParticipant[];
  perPerson: number;
  fullAmount: number;
};

export type GroupEnrollmentResult =
  | { ok: true; data: GroupEnrollmentInput }
  | { ok: false; error: string };

export function isGroupHoneypotTripped(input: unknown): boolean {
  if (!input || typeof input !== "object") return false;
  const value = (input as Record<string, unknown>)[GROUP_HONEYPOT_FIELD];
  return typeof value === "string" ? value.trim() !== "" : Boolean(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/**
 * Validate a group-enrollment payload and price it on the server.
 * Returns the whole-UGX total that Mobile Money must collect.
 */
export function validateGroupEnrollment(input: unknown): GroupEnrollmentResult {
  const body = asRecord(input);
  if (!body) return { ok: false, error: "Invalid request." };

  const companyName = cleanString(body.companyName, MAX_COMPANY);
  const contactName = cleanString(body.contactName, MAX_NAME);
  const contactEmailRaw = cleanString(body.contactEmail, 254);

  if (companyName === null) {
    return { ok: false, error: `Company name must be ${MAX_COMPANY} characters or fewer.` };
  }
  if (!companyName) return { ok: false, error: "Enter your company name." };

  if (contactName === null) {
    return { ok: false, error: `Your name must be ${MAX_NAME} characters or fewer.` };
  }
  if (!contactName) return { ok: false, error: "Enter your name." };

  if (contactEmailRaw === null) {
    return { ok: false, error: "Enter a shorter email address." };
  }
  const contactEmail = contactEmailRaw.toLowerCase();
  if (!isValidEmail(contactEmail)) {
    return { ok: false, error: "Enter a valid email address for the confirmation." };
  }

  const momoPhone = normalizeUgandaMobile(
    typeof body.momoPhone === "string" ? body.momoPhone : "",
  );
  if (!momoPhone) {
    return {
      ok: false,
      error:
        "Enter a valid MTN or Airtel Uganda number, e.g. 0771234567 or +256771234567.",
    };
  }

  const rawTeamSize = Number(body.teamSize);
  if (
    !Number.isInteger(rawTeamSize) ||
    rawTeamSize < 1 ||
    rawTeamSize > MAX_TEAM_SIZE
  ) {
    return {
      ok: false,
      error: `Number of participants must be between 1 and ${MAX_TEAM_SIZE}.`,
    };
  }

  if (!Array.isArray(body.participants) || body.participants.length !== rawTeamSize) {
    return { ok: false, error: "Enter a name and email for every participant." };
  }

  const participants: GroupParticipant[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < body.participants.length; i += 1) {
    const row = asRecord(body.participants[i]);
    const label = `Participant ${i + 1}`;
    if (!row) return { ok: false, error: `Enter a name and email for ${label}.` };

    const name = cleanString(row.name, MAX_NAME);
    const emailRaw = cleanString(row.email, 254);
    if (name === null) {
      return { ok: false, error: `${label}'s name must be ${MAX_NAME} characters or fewer.` };
    }
    if (!name) return { ok: false, error: `Enter a name for ${label}.` };
    if (emailRaw === null) {
      return { ok: false, error: `Enter a shorter email for ${label}.` };
    }
    const email = emailRaw.toLowerCase();
    if (!isValidEmail(email)) {
      return { ok: false, error: `Enter a valid email for ${label}.` };
    }
    if (seen.has(email)) {
      return { ok: false, error: "Each participant needs their own email address." };
    }
    seen.add(email);
    participants.push({ name, email });
  }

  const { team, perPerson, fullAmount } = computePricing(
    rawTeamSize,
    INTERNAL_AUDITOR_PRODUCT,
  );
  if (team !== rawTeamSize) {
    return {
      ok: false,
      error: `Number of participants must be between 1 and ${MAX_TEAM_SIZE}.`,
    };
  }

  if (body.fullAmount !== undefined && body.fullAmount !== null && body.fullAmount !== "") {
    const sent = Math.round(Number(body.fullAmount));
    if (!Number.isFinite(sent) || sent !== fullAmount) {
      return {
        ok: false,
        error: "Prices have changed since this page loaded. Please refresh and try again.",
      };
    }
  }

  if (!isCollectableUgx(fullAmount)) {
    return {
      ok: false,
      error: `Mobile Money can only collect whole amounts from UGX ${MOMO_MIN_AMOUNT.toLocaleString()} to UGX ${MOMO_MAX_AMOUNT.toLocaleString()}.`,
    };
  }

  return {
    ok: true,
    data: {
      companyName,
      contactName,
      contactEmail,
      momoPhone,
      participantCount: team,
      participants,
      perPerson,
      fullAmount,
    },
  };
}
