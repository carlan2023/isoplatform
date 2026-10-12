// ---------------------------------------------------------------------------
// GET /api/cron/roll-course-dates
//
// Vercel Cron (vercel.json, 00:05 UTC daily) sends
// `Authorization: Bearer ${CRON_SECRET}`. The secret must be set in the
// Vercel project; the route fails closed when it is missing.
//
// For each course whose start_date is before today in Africa/Kampala, write
// the next first Monday (on or after today). Inactive rows are included so
// reactivating a course does not bring back last month's date. Enrollment
// rows are never deleted or rewritten: they stay attached to the class they
// were booked for via enrollments.cohort_start + course_id.
//
// seats_taken is the live count of seats held (awaiting_confirmation +
// confirmed) for that new cohort, not last month's count and not a blind
// zero — a learner who already booked the upcoming date keeps their seat.
// If that count cannot be read (for example cohort_start does not exist yet),
// start_date is still rolled and seats_taken is left unchanged.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { kampalaYmd, rolledStartDate } from "@/lib/schedule";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HELD = ["awaiting_confirmation", "confirmed"] as const;

export async function GET(req: Request) {
  if (!isCronAuthorized(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = kampalaYmd(now);
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("courses")
    .select("id, start_date");

  if (error) {
    console.error("[cron:roll-course-dates] load failed:", error);
    return NextResponse.json({ error: "Could not load courses" }, { status: 500 });
  }

  const courses: {
    id: string;
    from: string;
    to: string;
    seats_taken: number | null;
  }[] = [];

  for (const course of data ?? []) {
    const next = rolledStartDate(course.start_date, now);
    if (!next || !course.id) continue;

    let seats: number | null = null;
    const { count, error: countError } = await admin
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("course_id", course.id)
      .eq("cohort_start", next)
      .in("status", [...HELD]);

    if (countError) {
      console.error(
        "[cron:roll-course-dates] seat count failed:",
        course.id,
        countError.message,
      );
    } else {
      seats = count ?? 0;
    }

    const patch: { start_date: string; seats_taken?: number } = { start_date: next };
    if (seats !== null) patch.seats_taken = seats;

    const { data: updated, error: updateError } = await admin
      .from("courses")
      .update(patch)
      .eq("id", course.id)
      .lt("start_date", today)
      .select("id");

    if (updateError) {
      console.error(
        "[cron:roll-course-dates] update failed:",
        course.id,
        updateError.message,
      );
      continue;
    }
    if (!updated || updated.length === 0) continue;

    courses.push({
      id: course.id,
      from: String(course.start_date).slice(0, 10),
      to: next,
      seats_taken: seats,
    });
  }

  return NextResponse.json({
    ok: true,
    as_of: today,
    rolled: courses.length,
    courses,
  });
}
