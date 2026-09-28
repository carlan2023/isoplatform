// ---------------------------------------------------------------------------
// Uganda Mobile Money phone-number normalisation.
//
// BroRacks expects international format (+2567XXXXXXXX). Learners type numbers
// in many shapes ("0771 234 567", "256771234567", "+256-771-234567", ...), so
// every number is normalised here — on the client for early feedback and again
// on the server, which is the check that counts.
// ---------------------------------------------------------------------------

/**
 * Normalise a Ugandan mobile number to E.164 (+2567XXXXXXXX), or return null if
 * it is not a valid Ugandan mobile number (9 national digits starting with 7).
 */
export function normalizeUgandaMobile(
  raw: string | null | undefined,
): string | null {
  if (typeof raw !== "string") return null;

  // Drop common separators; keep a leading "+" if present.
  const compact = raw.trim().replace(/[\s\-().]/g, "");
  if (!compact || compact.length > 20) return null;

  const hasIntlPrefix = compact.startsWith("+") || compact.startsWith("00");
  const digits = compact.startsWith("+")
    ? compact.slice(1)
    : compact.startsWith("00")
      ? compact.slice(2)
      : compact;

  if (!/^\d+$/.test(digits)) return null;

  let national: string;
  if (digits.startsWith("256")) {
    national = digits.slice(3);
    // Tolerate a trunk "0" typed after the country code (+256 0771...).
    if (national.length === 10 && national.startsWith("0")) {
      national = national.slice(1);
    }
  } else if (hasIntlPrefix) {
    // An explicit, non-Ugandan country code.
    return null;
  } else if (digits.length === 10 && digits.startsWith("0")) {
    national = digits.slice(1);
  } else {
    national = digits;
  }

  if (!/^7\d{8}$/.test(national)) return null;
  return `+256${national}`;
}
