// ---------------------------------------------------------------------------
// NAM QMS certificates of completion.
//
// A certificate records that a person finished a training course. It is not
// an ISO certificate, and NAM QMS does not certify organisations.
//
// Public lookups return PublicCertificate only. Email and phone are not
// fields on this record.
// ---------------------------------------------------------------------------

export const VERIFY_PAGE_TITLE = "Verify a NAM QMS training certificate";

export const VERIFY_PAGE_DESCRIPTION =
  "Check a NAM QMS certificate of completion. Confirm the holder, the course, the training dates, and whether it is valid or revoked.";

export const CERTIFICATE_DISCLAIMER =
  "A NAM QMS certificate of completion records that the named person finished a NAM QMS training course. It is not an ISO certificate, and NAM QMS does not certify organisations.";

/** Printed on a certificate, for example NAMQMS/TRN/2026/0001. */
export const CERTIFICATE_ID_EXAMPLE = "NAMQMS/TRN/2026/0001";

export const CERTIFICATE_ID_MAX = 80;

/** Canonical form uses slashes. Dashes are accepted and stored as slashes. */
export const CERTIFICATE_ID_RE = /^NAMQMS(?:\/[A-Z0-9]{2,12}){1,5}$/;

export const VERIFY_RATE_LIMIT = 30;
export const VERIFY_RATE_WINDOW_MS = 10 * 60 * 1000;

const NAME_RE = /^[\p{L}][\p{L} .'-]{0,118}[\p{L}.]$/u;
const COURSE_RE = /^[\p{L}0-9][\p{L}0-9 :&+./,'()-]{1,158}$/u;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export type CertificateStatus = "valid" | "revoked";

export type CertificateInput = {
  certificateId: string;
  holderFullName: string;
  course: string;
  trainingStart: string;
  trainingEnd: string;
  issueDate: string;
  status: CertificateStatus;
};

export type CertificateRecord = CertificateInput & {
  id: string;
  createdAt: string;
};

/** Fields a public lookup is allowed to return. */
export type PublicCertificate = {
  certificateId: string;
  holderName: string;
  course: string;
  trainingStart: string;
  trainingEnd: string;
  issueDate: string;
  status: CertificateStatus;
};

export type PublicLookupOutcome =
  | { kind: "invalid_id" }
  | { kind: "rate_limited" }
  | { kind: "unavailable" }
  | { kind: "not_found"; certificateId: string }
  | { kind: "found"; certificate: PublicCertificate };

export type CertificateField =
  | "certificateId"
  | "holderFullName"
  | "course"
  | "trainingStart"
  | "trainingEnd"
  | "issueDate"
  | "status";

export class CertificateConflictError extends Error {
  constructor() {
    super("A certificate with that ID already exists.");
    this.name = "CertificateConflictError";
  }
}

export class CertificateRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CertificateRejectedError";
  }
}

export class CertificateUnavailableError extends Error {
  readonly missingTable: boolean;
  constructor(missingTable = false) {
    super("Certificate verification is temporarily unavailable.");
    this.name = "CertificateUnavailableError";
    this.missingTable = missingTable;
  }
}

export const DEMO_CERTIFICATE_INPUTS: CertificateInput[] = [
  {
    certificateId: "NAMQMS/TRN/2026/DEMO1",
    holderFullName: "Sample Holder",
    course: "ISO 9001 Lead Auditor",
    trainingStart: "2026-01-06",
    trainingEnd: "2026-01-10",
    issueDate: "2026-01-12",
    status: "valid",
  },
  {
    certificateId: "NAMQMS/TRN/2026/DEMO2",
    holderFullName: "Sample Holder",
    course: "ISO 45001 Internal Auditor",
    trainingStart: "2026-02-02",
    trainingEnd: "2026-02-06",
    issueDate: "2026-02-08",
    status: "revoked",
  },
];

export const CERTIFICATE_CSV_TEMPLATE = [
  "certificate_id,holder_full_name,course,training_start,training_end,issue_date,status",
  "NAMQMS/TRN/2026/0001,Sample Holder,ISO 9001 Lead Auditor,2026-01-06,2026-01-10,2026-01-12,valid",
].join("\n");

const CSV_HEADER_FIELDS: Record<string, CertificateField> = {
  certificate_id: "certificateId",
  holder_full_name: "holderFullName",
  course: "course",
  training_start: "trainingStart",
  training_end: "trainingEnd",
  issue_date: "issueDate",
  status: "status",
};

const REQUIRED_FIELDS: CertificateField[] = [
  "certificateId",
  "holderFullName",
  "course",
  "trainingStart",
  "trainingEnd",
  "issueDate",
  "status",
];

/**
 * Trim, ignore capitalisation, and treat "-" as "/".
 * " namqms-trn-2026-0001 " and "NAMQMS/TRN/2026/0001" are the same ID.
 */
export function normalizeCertificateId(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "").replace(/-/g, "/");
}

export function isCertificateId(value: string): boolean {
  return value.length <= CERTIFICATE_ID_MAX && CERTIFICATE_ID_RE.test(value);
}

/** Join a /verify/[id] path. Encoded slashes (%2F) are decoded first. */
export function certificateIdFromPath(parts: string[] | undefined | null): string {
  if (!parts?.length) return "";
  return parts
    .map((part) => {
      const trimmed = part.trim();
      try {
        return decodeURIComponent(trimmed);
      } catch {
        return trimmed;
      }
    })
    .join("/");
}

export function isISODate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function formatCertificateDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return iso;
  return `${Number(match[3])} ${month} ${match[1]}`;
}

export function normalizePersonToken(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]/g, "");
}

/** Empty surname skips the extra check. A wrong surname does not match. */
export function holderSurnameMatches(
  holderFullName: string,
  surname: string | null | undefined,
): boolean {
  const given = normalizePersonToken(surname ?? "");
  if (!given) return true;
  const parts = holderFullName.trim().split(/\s+/);
  const last = normalizePersonToken(parts[parts.length - 1] ?? "");
  return last.length > 0 && last === given;
}

export function toPublicCertificate(record: CertificateRecord): PublicCertificate {
  return {
    certificateId: record.certificateId,
    holderName: record.holderFullName,
    course: record.course,
    trainingStart: record.trainingStart,
    trainingEnd: record.trainingEnd,
    issueDate: record.issueDate,
    status: record.status,
  };
}

export function isDemoCertificateId(certificateId: string): boolean {
  return DEMO_CERTIFICATE_INPUTS.some((row) => row.certificateId === certificateId);
}

export function clientIpFromHeaders(headerList: {
  get(name: string): string | null;
}): string {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 80);
  }
  const real = headerList.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 80);
  return "unknown";
}

export type RateLimiter = {
  isLimited(key: string, now?: number): boolean;
  reset(): void;
};

export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    reset() {
      hits.clear();
    },
    isLimited(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return true;
      }
      recent.push(now);
      hits.set(key, recent);
      if (hits.size > 5000) {
        for (const [storedKey, times] of hits) {
          if (times.every((t) => now - t >= windowMs)) hits.delete(storedKey);
        }
      }
      return false;
    },
  };
}

// Per server instance, same approach as the application form. It blunts
// casual enumeration of sequential certificate IDs; it is not a global cap.
export const verifyRateLimiter = createRateLimiter(
  VERIFY_RATE_LIMIT,
  VERIFY_RATE_WINDOW_MS,
);

export function isMissingCertificatesTable(
  error: { code?: string; message?: string } | null | undefined,
): boolean {
  if (!error) return false;
  const msg = `${error.code ?? ""} ${error.message ?? ""}`;
  return /42P01|PGRST205|could not find the table|schema cache/i.test(msg);
}

type ValidationResult =
  | { ok: true; value: CertificateInput }
  | { ok: false; error: string; field?: CertificateField };

function asText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.trim();
}

export function validateCertificateInput(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Enter the certificate details." };
  }
  const body = raw as Record<string, unknown>;
  const certificateId = normalizeCertificateId(asText(body.certificateId) ?? "");
  if (!asText(body.certificateId) || !isCertificateId(certificateId)) {
    return {
      ok: false,
      field: "certificateId",
      error: `Enter a certificate ID such as ${CERTIFICATE_ID_EXAMPLE}.`,
    };
  }

  const holderFullName = (asText(body.holderFullName) ?? "").replace(/\s+/g, " ");
  if (!holderFullName || holderFullName.length > 120 || !NAME_RE.test(holderFullName)) {
    return {
      ok: false,
      field: "holderFullName",
      error: "Enter the full name of the holder.",
    };
  }

  const course = (asText(body.course) ?? "").replace(/\s+/g, " ");
  if (!course || !COURSE_RE.test(course)) {
    return {
      ok: false,
      field: "course",
      error: "Enter the course, for example ISO 9001 Lead Auditor.",
    };
  }

  const trainingStart = asText(body.trainingStart) ?? "";
  const trainingEnd = asText(body.trainingEnd) ?? "";
  const issueDate = asText(body.issueDate) ?? "";
  if (!isISODate(trainingStart)) {
    return { ok: false, field: "trainingStart", error: "Enter a valid training start date." };
  }
  if (!isISODate(trainingEnd)) {
    return { ok: false, field: "trainingEnd", error: "Enter a valid training end date." };
  }
  if (!isISODate(issueDate)) {
    return { ok: false, field: "issueDate", error: "Enter a valid issue date." };
  }
  if (trainingEnd < trainingStart) {
    return {
      ok: false,
      field: "trainingEnd",
      error: "The training end date cannot be before the start date.",
    };
  }
  if (issueDate < trainingStart) {
    return {
      ok: false,
      field: "issueDate",
      error: "The issue date cannot be before the training start date.",
    };
  }

  const statusText = (asText(body.status) ?? "").toLowerCase();
  if (statusText !== "valid" && statusText !== "revoked") {
    return { ok: false, field: "status", error: "Status must be valid or revoked." };
  }

  return {
    ok: true,
    value: {
      certificateId,
      holderFullName,
      course,
      trainingStart,
      trainingEnd,
      issueDate,
      status: statusText,
    },
  };
}

export function certificateInputFromBody(body: Record<string, unknown>): ValidationResult {
  return validateCertificateInput({
    certificateId: body.certificateId ?? body.certificate_id,
    holderFullName: body.holderFullName ?? body.holder_full_name,
    course: body.course,
    trainingStart: body.trainingStart ?? body.training_start,
    trainingEnd: body.trainingEnd ?? body.training_end,
    issueDate: body.issueDate ?? body.issue_date,
    status: body.status,
  });
}

export function readOriginalCertificateId(body: Record<string, unknown>): string | null {
  const raw = body.originalCertificateId ?? body.original_certificate_id;
  if (typeof raw !== "string") return null;
  const id = normalizeCertificateId(raw);
  return isCertificateId(id) ? id : null;
}

export interface CertificateStore {
  getByCertificateId(certificateId: string): Promise<CertificateRecord | null>;
  list(): Promise<CertificateRecord[]>;
  insert(input: CertificateInput): Promise<CertificateRecord>;
  update(currentId: string, input: CertificateInput): Promise<CertificateRecord | null>;
  upsertMany(
    inputs: CertificateInput[],
  ): Promise<{ inserted: number; updated: number }>;
  deleteByCertificateIds(certificateIds: string[]): Promise<number>;
}

export function createMemoryCertificateStore(
  initial: CertificateInput[] = [],
): CertificateStore {
  const rows = new Map<string, CertificateRecord>();

  const put = (input: CertificateInput, existing?: CertificateRecord) => {
    const parsed = validateCertificateInput(input);
    if (!parsed.ok) throw new CertificateRejectedError(parsed.error);
    const record: CertificateRecord = {
      ...parsed.value,
      id: existing?.id ?? crypto.randomUUID(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    rows.set(record.certificateId, record);
    return { ...record };
  };

  for (const input of initial) put(input);

  return {
    async getByCertificateId(certificateId) {
      const row = rows.get(normalizeCertificateId(certificateId));
      return row ? { ...row } : null;
    },
    async list() {
      return [...rows.values()]
        .sort(
          (a, b) =>
            b.createdAt.localeCompare(a.createdAt) ||
            a.certificateId.localeCompare(b.certificateId),
        )
        .map((row) => ({ ...row }));
    },
    async insert(input) {
      const parsed = validateCertificateInput(input);
      if (!parsed.ok) throw new CertificateRejectedError(parsed.error);
      if (rows.has(parsed.value.certificateId)) throw new CertificateConflictError();
      return put(parsed.value);
    },
    async update(currentId, input) {
      const key = normalizeCertificateId(currentId);
      const existing = rows.get(key);
      if (!existing) return null;
      const parsed = validateCertificateInput(input);
      if (!parsed.ok) throw new CertificateRejectedError(parsed.error);
      if (
        parsed.value.certificateId !== key &&
        rows.has(parsed.value.certificateId)
      ) {
        throw new CertificateConflictError();
      }
      if (parsed.value.certificateId !== key) rows.delete(key);
      return put(parsed.value, existing);
    },
    async upsertMany(inputs) {
      let inserted = 0;
      let updated = 0;
      for (const input of inputs) {
        const parsed = validateCertificateInput(input);
        if (!parsed.ok) throw new CertificateRejectedError(parsed.error);
        const existing = rows.get(parsed.value.certificateId);
        put(parsed.value, existing);
        if (existing) updated += 1;
        else inserted += 1;
      }
      return { inserted, updated };
    },
    async deleteByCertificateIds(certificateIds) {
      let deleted = 0;
      for (const certificateId of certificateIds) {
        if (rows.delete(normalizeCertificateId(certificateId))) deleted += 1;
      }
      return deleted;
    },
  };
}

export async function lookupCertificate(
  store: CertificateStore,
  query: { certificateId: string; surname?: string | null },
): Promise<
  | { kind: "invalid_id" }
  | { kind: "not_found"; certificateId: string }
  | { kind: "found"; certificate: PublicCertificate }
> {
  const certificateId = normalizeCertificateId(query.certificateId);
  if (!isCertificateId(certificateId)) return { kind: "invalid_id" };
  const row = await store.getByCertificateId(certificateId);
  if (!row || !holderSurnameMatches(row.holderFullName, query.surname)) {
    return { kind: "not_found", certificateId };
  }
  return { kind: "found", certificate: toPublicCertificate(row) };
}

export async function removeDemoCertificates(store: CertificateStore): Promise<number> {
  return store.deleteByCertificateIds(
    DEMO_CERTIFICATE_INPUTS.map((row) => row.certificateId),
  );
}

type CsvError = { row: number; error: string };

/** Parse a certificate CSV. Row numbers match the file, with the header as row 1. */
export function parseCertificateCsv(
  text: string,
): { ok: true; rows: CertificateInput[] } | { ok: false; errors: CsvError[] } {
  if (text.length > 200_000) {
    return { ok: false, errors: [{ row: 1, error: "That file is too large." }] };
  }
  const table = parseCsv(text.replace(/^\uFEFF/, ""));
  if (table.length === 0) {
    return { ok: false, errors: [{ row: 1, error: "The file is empty." }] };
  }
  const header = table[0].map((cell) => cell.trim().toLowerCase());
  const indexes = new Map<CertificateField, number>();
  header.forEach((cell, index) => {
    const field = CSV_HEADER_FIELDS[cell];
    if (field && !indexes.has(field)) indexes.set(field, index);
  });
  const missing = REQUIRED_FIELDS.filter((field) => !indexes.has(field));
  if (missing.length > 0) {
    return {
      ok: false,
      errors: [
        {
          row: 1,
          error:
            "Use the columns certificate_id, holder_full_name, course, training_start, training_end, issue_date, status.",
        },
      ],
    };
  }
  const data = table.slice(1);
  if (data.length === 0) {
    return { ok: false, errors: [{ row: 1, error: "Add at least one certificate under the header." }] };
  }
  if (data.length > 500) {
    return { ok: false, errors: [{ row: 501, error: "Import up to 500 certificates at a time." }] };
  }

  const rows: CertificateInput[] = [];
  const errors: CsvError[] = [];
  const seen = new Set<string>();
  data.forEach((cells, index) => {
    const rowNumber = index + 2;
    const raw: Record<string, string> = {};
    for (const field of REQUIRED_FIELDS) {
      raw[field] = cells[indexes.get(field) ?? -1] ?? "";
    }
    const parsed = validateCertificateInput(raw);
    if (!parsed.ok) {
      errors.push({ row: rowNumber, error: parsed.error });
      return;
    }
    if (seen.has(parsed.value.certificateId)) {
      errors.push({ row: rowNumber, error: "That certificate ID is repeated in this file." });
      return;
    }
    seen.add(parsed.value.certificateId);
    rows.push(parsed.value);
  });
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, rows };
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      cell = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.trim() !== "")) rows.push(row);
  }
  return rows;
}
