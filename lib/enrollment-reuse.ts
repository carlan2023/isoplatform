// ---------------------------------------------------------------------------
// Which enrollment row a learner should continue with for a course.
//
// A cancelled or unpaid attempt is reused so retrying payment does not insert
// another row. A confirmed seat, or a payment still in progress, blocks a
// second enrollment for the same cohort.
// ---------------------------------------------------------------------------

export interface ReuseCandidate {
  id: string;
  status: string;
  cohort_start?: string | null;
}

export type ReuseChoice =
  | { kind: "already"; id: string; status: string }
  | { kind: "reuse"; id: string; reset: boolean }
  | { kind: "create" };

function inCurrentCohort(row: ReuseCandidate, cohort: string): boolean {
  if (row.cohort_start == null) return true;
  return String(row.cohort_start).slice(0, 10) >= cohort;
}

/**
 * `rows` should be newest first. `cohort` is YYYY-MM-DD (currentCohortStart).
 * Pending rows from an earlier cohort are included so payment can move them
 * onto the class currently on sale.
 */
export function pickEnrollmentToReuse(
  rows: ReuseCandidate[],
  cohort: string,
): ReuseChoice {
  const relevant = rows.filter(
    (row) => row.status === "pending" || inCurrentCohort(row, cohort),
  );
  const confirmed = relevant.find((row) => row.status === "confirmed");
  if (confirmed) return { kind: "already", id: confirmed.id, status: confirmed.status };
  const awaiting = relevant.find((row) => row.status === "awaiting_confirmation");
  if (awaiting) return { kind: "already", id: awaiting.id, status: awaiting.status };
  const pending = relevant.find((row) => row.status === "pending");
  if (pending) return { kind: "reuse", id: pending.id, reset: false };
  const cancelled = relevant.find((row) => row.status === "cancelled");
  if (cancelled) return { kind: "reuse", id: cancelled.id, reset: true };
  return { kind: "create" };
}
