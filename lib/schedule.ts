// ---------------------------------------------------------------------------
// Rolling class schedule.
//
// A new class of every course starts on the first Monday of a month. Public
// pages and enrollment must not trust courses.start_date blindly: once that
// date has passed (Africa/Kampala calendar day), the advertised cohort is the
// next first Monday on or after today. The daily cron writes the same date
// back to Supabase; rendering with these helpers keeps the site correct even
// when that write has not happened yet.
//
// Returned Date values are UTC midnights of the Kampala calendar day, so
// toISODate() / formatClassDate() do not shift depending on the server's
// local timezone. Africa/Kampala is UTC+3 year-round (no daylight saving).
// ---------------------------------------------------------------------------

const KAMPALA = "Africa/Kampala";

function assertValidDate(from: Date): void {
  if (!(from instanceof Date) || Number.isNaN(from.getTime())) {
    throw new RangeError("A valid Date is required");
  }
}

/** Calendar year/month/day of `from` in Africa/Kampala. Month is 1–12. */
function kampalaParts(from: Date): { year: number; month: number; day: number } {
  assertValidDate(from);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KAMPALA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(from);
  const num = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const year = num("year");
  const month = num("month");
  const day = num("day");
  if (!year || !month || !day) {
    throw new RangeError("Could not read the Africa/Kampala calendar date");
  }
  return { year, month, day };
}

/** YYYY-MM-DD for `from` in Africa/Kampala. */
export function kampalaYmd(from: Date = new Date()): string {
  const { year, month, day } = kampalaParts(from);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** UTC midnight of the first Monday of a Gregorian month. `monthIndex` is 0–11. */
function firstMondayOfUtcMonth(year: number, monthIndex: number): Date {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const weekday = first.getUTCDay(); // 0 = Sun … 6 = Sat
  const daysUntilMonday = (8 - weekday) % 7; // 0 when the 1st is already a Monday
  return new Date(Date.UTC(year, monthIndex, 1 + daysUntilMonday));
}

/**
 * The first Monday of a month that falls on or after `from`, using the
 * Africa/Kampala calendar date of `from`. If that date is itself the first
 * Monday, it is returned (the class has not passed yet).
 */
export function nextFirstMonday(from: Date): Date {
  const { year, month, day } = kampalaParts(from);
  const thisMonth = firstMondayOfUtcMonth(year, month - 1);
  if (day <= thisMonth.getUTCDate()) return thisMonth;
  // `month` is 1–12; Date.UTC month index `month` is the following month
  // and rolls the year when `month` is 12.
  return firstMondayOfUtcMonth(year, month);
}

/**
 * Interpret a YYYY-MM-DD calendar date as civil midnight in Kampala so
 * nextFirstMonday reads that same calendar day back.
 */
function utcInstantForKampalaYmd(ymd: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) throw new RangeError(`Invalid calendar date: ${ymd}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Kampala is fixed UTC+3, so local midnight is 21:00 UTC the previous day.
  return new Date(Date.UTC(year, month - 1, day, -3, 0, 0));
}

/**
 * Start date to advertise and enroll against.
 *
 * A stored date that is still today or later (Kampala) is kept, snapped
 * forward to a first Monday if it is not one. A missing or already-passed
 * date rolls to the next first Monday on or after `now`.
 */
export function advertisedCourseStart(
  stored: string | null | undefined,
  now: Date = new Date(),
): Date {
  const today = kampalaYmd(now);
  const storedDay = stored?.slice(0, 10) ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(storedDay) || storedDay < today) {
    return nextFirstMonday(now);
  }
  return nextFirstMonday(utcInstantForKampalaYmd(storedDay));
}

/**
 * YYYY-MM-DD to write when a stored start_date is before today in Kampala.
 * Returns null when the row should be left alone (missing, invalid, or not
 * yet passed — including a class that starts today).
 */
export function rolledStartDate(
  stored: string | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!stored || !/^\d{4}-\d{2}-\d{2}/.test(stored)) return null;
  const current = stored.slice(0, 10);
  if (current >= kampalaYmd(now)) return null;
  return toISODate(nextFirstMonday(now));
}

/** The first Monday of the month *after* `from` (UTC). Not the catalogue rule. */
export function firstMondayOfNextMonth(from: Date = new Date()): Date {
  assertValidDate(from);
  const firstOfNextMonth = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1),
  );
  const weekday = firstOfNextMonth.getUTCDay();
  const daysUntilMonday = (8 - weekday) % 7;
  firstOfNextMonth.setUTCDate(1 + daysUntilMonday);
  return firstOfNextMonth;
}

/** Upcoming cohort when no stored course date is available. */
export function nextClassStart(from: Date = new Date()): Date {
  return nextFirstMonday(from);
}

/**
 * The cohort currently on sale, as YYYY-MM-DD. Prefer advertisedCourseStart
 * when a course row's start_date is known. Must stay in sync with
 * next_cohort_start() in db/cohorts.sql.
 */
export function currentCohortStart(from: Date = new Date()): string {
  return toISODate(nextClassStart(from));
}

/** Human-friendly label, e.g. "Monday, 3 August 2026". */
export function formatClassDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Short label without the weekday, e.g. "3 August 2026". */
export function formatClassDateShort(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Label for the class a course should advertise, rolling a stale date. */
export function classStartLabel(
  stored?: string | null,
  now: Date = new Date(),
): string {
  return formatClassDate(advertisedCourseStart(stored, now));
}

/** ISO calendar date (YYYY-MM-DD) for structured data / schema.org. */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
