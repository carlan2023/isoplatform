// ---------------------------------------------------------------------------
// Server-side certificate storage.
//
// Public pages and /api/verify call runPublicLookup. That is the only read
// path for visitors: it returns a PublicCertificate or a generic miss.
// Admin routes use the same store after requireAdminOrLocalDemo().
// ---------------------------------------------------------------------------

import "server-only";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { demoSeedEnabled, localMemoryCertificateStore } from "@/lib/certificate-runtime";
import {
  CertificateConflictError,
  CertificateRejectedError,
  CertificateUnavailableError,
  DEMO_CERTIFICATE_INPUTS,
  createMemoryCertificateStore,
  isCertificateId,
  isMissingCertificatesTable,
  lookupCertificate,
  normalizeCertificateId,
  validateCertificateInput,
  verifyRateLimiter,
  type CertificateInput,
  type CertificateRecord,
  type CertificateStore,
  type PublicLookupOutcome,
} from "@/lib/certificates";

const COLUMNS =
  "id, certificate_id, holder_full_name, course, training_start, training_end, issue_date, status, created_at";

let memoryStore: CertificateStore | null = null;
let demoSeed: Promise<void> | null = null;

export function getCertificateStore(): CertificateStore {
  if (localMemoryCertificateStore()) {
    if (!memoryStore) {
      memoryStore = createMemoryCertificateStore(DEMO_CERTIFICATE_INPUTS);
    }
    return memoryStore;
  }
  return supabaseCertificateStore;
}

export async function runPublicLookup(args: {
  certificateId: string;
  surname?: string | null;
  ip: string;
  now?: number;
}): Promise<PublicLookupOutcome> {
  if (verifyRateLimiter.isLimited(args.ip || "unknown", args.now)) {
    return { kind: "rate_limited" };
  }
  const certificateId = normalizeCertificateId(args.certificateId);
  if (!isCertificateId(certificateId)) return { kind: "invalid_id" };
  try {
    const store = getCertificateStore();
    await ensureDemoCertificates(store);
    return await lookupCertificate(store, {
      certificateId,
      surname: args.surname,
    });
  } catch (error) {
    console.error("[verify] lookup failed:", error);
    return { kind: "unavailable" };
  }
}

export async function ensureDemoCertificates(store: CertificateStore): Promise<void> {
  if (!demoSeedEnabled()) return;
  if (!demoSeed) {
    demoSeed = insertMissingDemoRows(store).catch((error) => {
      demoSeed = null;
      throw error;
    });
  }
  await demoSeed;
}

async function insertMissingDemoRows(store: CertificateStore): Promise<void> {
  for (const demo of DEMO_CERTIFICATE_INPUTS) {
    const existing = await store.getByCertificateId(demo.certificateId);
    if (existing) continue;
    try {
      await store.insert(demo);
    } catch (error) {
      if (error instanceof CertificateConflictError) continue;
      throw error;
    }
  }
}

function mapRow(row: Record<string, unknown>): CertificateRecord {
  const parsed = validateCertificateInput({
    certificateId: row.certificate_id,
    holderFullName: row.holder_full_name,
    course: row.course,
    trainingStart: String(row.training_start ?? "").slice(0, 10),
    trainingEnd: String(row.training_end ?? "").slice(0, 10),
    issueDate: String(row.issue_date ?? "").slice(0, 10),
    status: row.status === "valid" ? "valid" : "revoked",
  });
  if (!parsed.ok) {
    throw new CertificateUnavailableError(false);
  }
  return {
    ...parsed.value,
    id: String(row.id),
    createdAt: String(row.created_at),
  };
}

function toDb(input: CertificateInput) {
  return {
    certificate_id: input.certificateId,
    holder_full_name: input.holderFullName,
    course: input.course,
    training_start: input.trainingStart,
    training_end: input.trainingEnd,
    issue_date: input.issueDate,
    status: input.status,
    updated_at: new Date().toISOString(),
  };
}

function raise(error: { code?: string; message?: string } | null): never {
  console.error("[certificates]", error);
  if (isMissingCertificatesTable(error)) {
    throw new CertificateUnavailableError(true);
  }
  if (error?.code === "23505") throw new CertificateConflictError();
  if (error?.code === "23514") {
    throw new CertificateRejectedError("Those certificate details were rejected.");
  }
  throw new CertificateUnavailableError(false);
}

export function certificateAdminError(error: unknown, action: string) {
  if (
    error instanceof CertificateRejectedError ||
    error instanceof CertificateConflictError
  ) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof CertificateUnavailableError) {
    return NextResponse.json(
      {
        error: error.missingTable
          ? "The certificates table is not in the database yet. Run db/certificates.sql in the Supabase SQL editor, then reload this page."
          : `Could not ${action}. Please try again.`,
      },
      { status: error.missingTable ? 503 : 500 },
    );
  }
  console.error(`[admin/certificates] ${action} failed:`, error);
  return NextResponse.json(
    { error: `Could not ${action}. Please try again.` },
    { status: 500 },
  );
}

const supabaseCertificateStore: CertificateStore = {
  async getByCertificateId(certificateId) {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("certificates")
      .select(COLUMNS)
      .eq("certificate_id", normalizeCertificateId(certificateId))
      .maybeSingle();
    if (error) raise(error);
    return data ? mapRow(data as Record<string, unknown>) : null;
  },
  async list() {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("certificates")
      .select(COLUMNS)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) raise(error);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  },
  async insert(input) {
    const parsed = validateCertificateInput(input);
    if (!parsed.ok) throw new CertificateRejectedError(parsed.error);
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("certificates")
      .insert(toDb(parsed.value))
      .select(COLUMNS)
      .single();
    if (error) raise(error);
    return mapRow(data as Record<string, unknown>);
  },
  async update(currentId, input) {
    const parsed = validateCertificateInput(input);
    if (!parsed.ok) throw new CertificateRejectedError(parsed.error);
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("certificates")
      .update(toDb(parsed.value))
      .eq("certificate_id", normalizeCertificateId(currentId))
      .select(COLUMNS)
      .maybeSingle();
    if (error) raise(error);
    return data ? mapRow(data as Record<string, unknown>) : null;
  },
  async upsertMany(inputs) {
    const parsed = inputs.map((input) => {
      const result = validateCertificateInput(input);
      if (!result.ok) throw new CertificateRejectedError(result.error);
      return result.value;
    });
    const admin = getSupabaseAdmin();
    const ids = parsed.map((row) => row.certificateId);
    const { data: existing, error: existingError } = await admin
      .from("certificates")
      .select("certificate_id")
      .in("certificate_id", ids);
    if (existingError) raise(existingError);
    const existingIds = new Set(
      (existing ?? []).map((row) => String((row as { certificate_id: string }).certificate_id)),
    );
    const { error } = await admin
      .from("certificates")
      .upsert(parsed.map(toDb), { onConflict: "certificate_id" });
    if (error) raise(error);
    const updated = parsed.filter((row) => existingIds.has(row.certificateId)).length;
    return { inserted: parsed.length - updated, updated };
  },
  async deleteByCertificateIds(certificateIds) {
    const ids = certificateIds.map(normalizeCertificateId).filter(isCertificateId);
    if (ids.length === 0) return 0;
    const admin = getSupabaseAdmin();
    const { error, count } = await admin
      .from("certificates")
      .delete({ count: "exact" })
      .in("certificate_id", ids);
    if (error) raise(error);
    return count ?? 0;
  },
};
