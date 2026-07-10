// ---------------------------------------------------------------------------
// Rolling class schedule.
//
// Public course/enrolment pages always advertise the *next* cohort rather than
// a fixed calendar date, so the site never shows a stale start date. The next
// cohort begins on the first Monday of the following calendar month, computed
// on every request. Because the pages that use this revalidate frequently, the
// advertised date rolls forward automatically each month with no manual edits.
//
// All maths is done in UTC so the result does not drift depending on the
// server's local timezone.
// ---------------------------------------------------------------------------

/** The first Monday of the month *after* `from` (defaults to today). */
export function firstMondayOfNextMonth(from: Date = new Date()): Date {
  const firstOfNextMonth = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1),
  );
  const weekday = firstOfNextMonth.getUTCDay(); // 0 = Sun … 6 = Sat
  const daysUntilMonday = (8 - weekday) % 7; // 0 when the 1st is already a Monday
  firstOfNextMonth.setUTCDate(1 + daysUntilMonday);
  return firstOfNextMonth;
}

/** The next cohort start date. Alias kept for readable call sites. */
export function nextClassStart(from: Date = new Date()): Date {
  return firstMondayOfNextMonth(from);
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

/** ISO calendar date (YYYY-MM-DD) for structured data / schema.org. */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
