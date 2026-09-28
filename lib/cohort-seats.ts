// ---------------------------------------------------------------------------
// Live seat counts for the cohort currently on sale — SERVER ONLY.
//
// courses.seats_taken is only recomputed when an enrollment changes, so on the
// first day of a new month it still reflects the previous cohort. Pages call
// withCurrentCohortSeats() to replace it with a live count of seats held
// (awaiting_confirmation + confirmed) for the next class start date.
//
// If db/cohorts.sql has not been run yet (no enrollments.cohort_start column)
// the query fails and the stored counter is used unchanged.
// ---------------------------------------------------------------------------

import "server-only";
import { getSupabaseAdmin } from "./supabase-admin";
import { currentCohortStart } from "./schedule";

export async function withCurrentCohortSeats<
  T extends { id: string; seats_taken: number | null },
>(courses: T[]): Promise<T[]> {
  if (courses.length === 0) return courses;
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("enrollments")
      .select("course_id")
      .in(
        "course_id",
        courses.map((c) => c.id),
      )
      .eq("cohort_start", currentCohortStart())
      .in("status", ["awaiting_confirmation", "confirmed"]);

    if (error) {
      console.error("[cohort-seats] live seat count failed:", error.message);
      return courses;
    }

    const held = new Map<string, number>();
    for (const row of data ?? []) {
      held.set(row.course_id, (held.get(row.course_id) ?? 0) + 1);
    }
    return courses.map((c) => ({ ...c, seats_taken: held.get(c.id) ?? 0 }));
  } catch (e) {
    console.error("[cohort-seats] live seat count failed:", e);
    return courses;
  }
}
