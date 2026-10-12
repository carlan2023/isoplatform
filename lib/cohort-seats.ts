// ---------------------------------------------------------------------------
// Live seat counts for the cohort currently on sale — SERVER ONLY.
//
// courses.seats_taken is only recomputed when an enrollment changes, so after
// a class date passes it still reflects the previous cohort. Pages call
// withCurrentCohortSeats() to replace it with a live count of seats held
// (awaiting_confirmation + confirmed) for each course's advertised start
// (lib/schedule.ts advertisedCourseStart — the next first Monday when the
// stored date has passed).
//
// If db/cohorts.sql has not been run yet (no enrollments.cohort_start column)
// the query fails and the stored counter is used unchanged.
// ---------------------------------------------------------------------------

import "server-only";
import { getSupabaseAdmin } from "./supabase-admin";
import { advertisedCourseStart, toISODate } from "./schedule";

export async function withCurrentCohortSeats<
  T extends { id: string; seats_taken: number | null; start_date?: string | null },
>(courses: T[], now: Date = new Date()): Promise<T[]> {
  if (courses.length === 0) return courses;
  const cohortByCourse = new Map(
    courses.map((c) => [c.id, toISODate(advertisedCourseStart(c.start_date, now))]),
  );
  const cohorts = [...new Set(cohortByCourse.values())];
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("enrollments")
      .select("course_id, cohort_start")
      .in(
        "course_id",
        courses.map((c) => c.id),
      )
      .in("cohort_start", cohorts)
      .in("status", ["awaiting_confirmation", "confirmed"]);

    if (error) {
      console.error("[cohort-seats] live seat count failed:", error.message);
      return courses;
    }

    const held = new Map<string, number>();
    for (const row of data ?? []) {
      const expected = cohortByCourse.get(row.course_id);
      const actual = String(row.cohort_start ?? "").slice(0, 10);
      if (!expected || actual !== expected) continue;
      held.set(row.course_id, (held.get(row.course_id) ?? 0) + 1);
    }
    return courses.map((c) => ({ ...c, seats_taken: held.get(c.id) ?? 0 }));
  } catch (e) {
    console.error("[cohort-seats] live seat count failed:", e);
    return courses;
  }
}
