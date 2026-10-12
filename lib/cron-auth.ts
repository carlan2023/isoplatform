// ---------------------------------------------------------------------------
// Vercel Cron calls the scheduled route with `Authorization: Bearer <secret>`,
// where <secret> is the CRON_SECRET environment variable. Fail closed when
// the secret is unset. Compare a hash so a wrong-length header cannot throw
// or leak the secret's length via an early return.
// ---------------------------------------------------------------------------

import { createHash, timingSafeEqual } from "crypto";

export function isCronAuthorized(
  authorizationHeader: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !authorizationHeader) return false;
  const actual = createHash("sha256").update(authorizationHeader).digest();
  const expected = createHash("sha256")
    .update(`Bearer ${secret}`)
    .digest();
  return timingSafeEqual(actual, expected);
}
