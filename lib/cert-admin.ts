// ---------------------------------------------------------------------------
// Token-authenticated certificate admin commands.
//
// POST /api/admin/certificates/service uses these helpers. The bearer token
// is CERT_ADMIN_TOKEN. Fail closed when it is unset. This module does not
// read the environment itself, so tests can call it without a server.
// ---------------------------------------------------------------------------

import { createHash, timingSafeEqual } from "crypto";
import {
  CERTIFICATE_ID_EXAMPLE,
  certificateInputFromBody,
  classifyCertificateId,
  normalizeCertificateId,
  parseCertificateCsv,
  validateCertificateInput,
  type CertificateInput,
  type CertificateRecord,
  type CertificateStore,
} from "./certificates";

export function isCertAdminAuthorized(
  authorizationHeader: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !authorizationHeader) return false;
  const actual = createHash("sha256").update(authorizationHeader).digest();
  const expected = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(actual, expected);
}

export type CertAdminCommand =
  | { action: "add"; certificate: CertificateInput }
  | { action: "revoke"; certificateIds: string[] }
  | { action: "bulk"; certificates: CertificateInput[] };

export type CertAdminParse =
  | { ok: true; command: CertAdminCommand }
  | { ok: false; error: string; errors?: { row: number; error: string }[] };

const MAX_BATCH = 500;

export function parseCertAdminBody(body: Record<string, unknown>): CertAdminParse {
  const action = body.action;
  if (action === "add") return parseAdd(body);
  if (action === "revoke") return parseRevoke(body);
  if (action === "bulk") return parseBulk(body);
  return { ok: false, error: "Action must be add, revoke, or bulk." };
}

function parseAdd(body: Record<string, unknown>): CertAdminParse {
  const certificate = body.certificate;
  if (!certificate || typeof certificate !== "object" || Array.isArray(certificate)) {
    return { ok: false, error: "Enter the certificate details." };
  }
  const parsed = certificateInputFromBody(certificate as Record<string, unknown>);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return { ok: true, command: { action: "add", certificate: parsed.value } };
}

function parseRevoke(body: Record<string, unknown>): CertAdminParse {
  const rawIds: unknown[] = [];
  if (typeof body.certificateId === "string") rawIds.push(body.certificateId);
  if (Array.isArray(body.certificateIds)) rawIds.push(...body.certificateIds);
  if (rawIds.length === 0) {
    return { ok: false, error: "Enter the certificate ID to revoke." };
  }
  if (rawIds.length > MAX_BATCH) {
    return { ok: false, error: "Revoke up to 500 certificates at a time." };
  }
  const certificateIds: string[] = [];
  const seen = new Set<string>();
  for (const raw of rawIds) {
    if (typeof raw !== "string") {
      return { ok: false, error: `Enter a certificate ID such as ${CERTIFICATE_ID_EXAMPLE}.` };
    }
    const id = normalizeCertificateId(raw);
    const idClass = classifyCertificateId(id);
    if (idClass === "invalid_number") return { ok: false, error: "Invalid number." };
    if (idClass !== "valid") {
      return { ok: false, error: `Enter a certificate ID such as ${CERTIFICATE_ID_EXAMPLE}.` };
    }
    if (seen.has(id)) continue;
    seen.add(id);
    certificateIds.push(id);
  }
  return { ok: true, command: { action: "revoke", certificateIds } };
}

function parseBulk(body: Record<string, unknown>): CertAdminParse {
  const hasCsv = typeof body.csv === "string";
  const hasRows = Array.isArray(body.certificates);
  if (hasCsv === hasRows) {
    return { ok: false, error: "Send either certificates or a csv, not both." };
  }
  if (hasCsv) {
    const parsed = parseCertificateCsv(body.csv as string);
    if (!parsed.ok) {
      return { ok: false, error: "Fix the rows below and import again.", errors: parsed.errors };
    }
    return { ok: true, command: { action: "bulk", certificates: parsed.rows } };
  }
  const rows = body.certificates as unknown[];
  if (rows.length === 0) {
    return { ok: false, error: "Add at least one certificate." };
  }
  if (rows.length > MAX_BATCH) {
    return { ok: false, error: "Import up to 500 certificates at a time." };
  }
  const certificates: CertificateInput[] = [];
  const errors: { row: number; error: string }[] = [];
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      errors.push({ row: index + 1, error: "Enter the certificate details." });
      return;
    }
    const parsed = validateCertificateInput(row);
    if (!parsed.ok) {
      errors.push({ row: index + 1, error: parsed.error });
      return;
    }
    if (seen.has(parsed.value.certificateId)) {
      errors.push({ row: index + 1, error: "That certificate ID is repeated in this file." });
      return;
    }
    seen.add(parsed.value.certificateId);
    certificates.push(parsed.value);
  });
  if (errors.length > 0) {
    return { ok: false, error: "Fix the rows below and import again.", errors };
  }
  return { ok: true, command: { action: "bulk", certificates } };
}

export type CertAdminApplyResult =
  | { ok: true; action: "add"; certificate: CertificateRecord }
  | { ok: true; action: "revoke"; certificates: CertificateRecord[] }
  | { ok: true; action: "bulk"; inserted: number; updated: number }
  | { ok: false; status: 404; error: string };

export async function applyCertAdminCommand(
  store: CertificateStore,
  command: CertAdminCommand,
): Promise<CertAdminApplyResult> {
  if (command.action === "add") {
    const certificate = await store.insert(command.certificate);
    return { ok: true, action: "add", certificate };
  }
  if (command.action === "revoke") {
    const existing: CertificateRecord[] = [];
    for (const certificateId of command.certificateIds) {
      const row = await store.getByCertificateId(certificateId);
      if (!row) {
        return { ok: false, status: 404, error: "That certificate was not found." };
      }
      existing.push(row);
    }
    const certificates: CertificateRecord[] = [];
    for (const row of existing) {
      if (row.status === "revoked") {
        certificates.push(row);
        continue;
      }
      const updated = await store.update(row.certificateId, { ...row, status: "revoked" });
      if (!updated) {
        return { ok: false, status: 404, error: "That certificate was not found." };
      }
      certificates.push(updated);
    }
    return { ok: true, action: "revoke", certificates };
  }
  const result = await store.upsertMany(command.certificates);
  return { ok: true, action: "bulk", inserted: result.inserted, updated: result.updated };
}

