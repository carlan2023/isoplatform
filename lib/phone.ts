// ---------------------------------------------------------------------------
// Uganda Mobile Money phone-number normalisation.
//
// BroRacks requires E.164 +2567XXXXXXXX. Learners type 07…, 7…, 2567… or
// +2567…, so every number is normalised here — on the client for instant
// feedback and again on the server, which is the check that counts.
//
// Only MTN (76, 77, 78, 79) and Airtel (70, 74, 75) prefixes are accepted.
// ---------------------------------------------------------------------------

export type MomoNetwork = "MTN" | "Airtel";

const MTN_PREFIXES = new Set(["76", "77", "78", "79"]);
const AIRTEL_PREFIXES = new Set(["70", "74", "75"]);

export const MOMO_PREFIX_ERROR =
  "Use an MTN number (76, 77, 78 or 79) or an Airtel number (70, 74 or 75).";

export const MOMO_FORMAT_ERROR =
  "Enter a valid MTN or Airtel Uganda number, e.g. 0771234567 or +256771234567.";

export interface MomoPhoneInspection {
  /** Digits to show after the fixed +256 prefix. May be partial. */
  local: string;
  /** +2567XXXXXXXX when the number is complete and a supported prefix. */
  e164: string | null;
  network: MomoNetwork | null;
  /** Set as soon as the prefix or the format is known to be wrong. */
  error: string | null;
}

function networkFromNational(national: string): MomoNetwork | null {
  const prefix = national.slice(0, 2);
  if (MTN_PREFIXES.has(prefix)) return "MTN";
  if (AIRTEL_PREFIXES.has(prefix)) return "Airtel";
  return null;
}

/**
 * Inspect a Ugandan Mobile Money number, including partial input.
 * `e164` is set only for a complete MTN or Airtel number.
 */
export function inspectMomoPhone(
  raw: string | null | undefined,
): MomoPhoneInspection {
  const empty: MomoPhoneInspection = {
    local: "",
    e164: null,
    network: null,
    error: null,
  };
  if (typeof raw !== "string") return empty;

  const compact = raw.trim().replace(/[\s\-().]/g, "");
  if (!compact) return empty;
  if (compact.length > 20) return { ...empty, error: MOMO_FORMAT_ERROR };

  const explicitIntl = compact.startsWith("+") || compact.startsWith("00");
  const body = compact.startsWith("+")
    ? compact.slice(1)
    : compact.startsWith("00")
      ? compact.slice(2)
      : compact;

  if (!/^\d+$/.test(body)) {
    const digits = body.replace(/\D/g, "").slice(0, 10);
    return { local: digits, e164: null, network: null, error: MOMO_FORMAT_ERROR };
  }

  if (explicitIntl && !body.startsWith("256")) {
    return {
      local: body.slice(0, 10),
      e164: null,
      network: null,
      error: MOMO_FORMAT_ERROR,
    };
  }

  // Country code is present on +256 / 00256, or on a full 2567… paste.
  // A short "256…" typed after the fixed prefix is not a country code.
  let national = body;
  if (body.startsWith("256") && (explicitIntl || body.length > 9)) {
    national = body.slice(3);
    if (national.startsWith("0")) national = national.slice(1);
  } else if (body.startsWith("0")) {
    national = body.slice(1);
  }

  const local = national.slice(0, 10);
  if (!local) return empty;

  if (local[0] !== "7") {
    return { local, e164: null, network: null, error: MOMO_PREFIX_ERROR };
  }

  if (local.length < 2) {
    return { local, e164: null, network: null, error: null };
  }

  const network = networkFromNational(local);
  if (!network) {
    return { local, e164: null, network: null, error: MOMO_PREFIX_ERROR };
  }
  if (local.length > 9) {
    return { local, e164: null, network, error: MOMO_FORMAT_ERROR };
  }
  if (local.length < 9) {
    return { local, e164: null, network, error: null };
  }

  return { local, e164: `+256${local}`, network, error: null };
}

/**
 * Normalise a Ugandan Mobile Money number to +2567XXXXXXXX, or return null
 * if it is not a complete MTN or Airtel Uganda number.
 */
export function normalizeUgandaMobile(
  raw: string | null | undefined,
): string | null {
  return inspectMomoPhone(raw).e164;
}
