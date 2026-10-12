// ---------------------------------------------------------------------------
// POST /api/enroll — step 1 of enrollment: capture details, create a PENDING
// enrollment. No payment and no seat is held here (a seat is only held once
// the student initiates payment via POST /api/enroll/pay).
//
// Requires a signed-in user. Identity comes from the session cookie (never from
// the request body), and privileged writes go through the service-role admin
// client because enrollments/profiles have no client-write RLS policy.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { advertisedCourseStart, toISODate } from "@/lib/schedule";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { cleanString, isUuid, readJsonObject } from "@/lib/validation";
import { pickEnrollmentToReuse } from "@/lib/enrollment-reuse";
import { reconcileEnrollmentById } from "@/lib/payment-reconcile";

const MAX_NAME = 120;
const MAX_COMPANY = 160;
const MAX_PHONE = 30;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to enroll." },
        { status: 401 },
      );
    }

    const body = await readJsonObject(req);
    if (!body) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const courseId = body.courseId;
    const full_name = cleanString(body.full_name, MAX_NAME);
    const company = cleanString(body.company, MAX_COMPANY);
    const phone = cleanString(body.phone, MAX_PHONE);

    const missing: string[] = [];
    if (!courseId) missing.push("course");
    if (!full_name) missing.push("full name");
    if (!phone) missing.push("phone number");
    if (missing.length) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}.` },
        { status: 400 },
      );
    }
    if (full_name === null || company === null || phone === null) {
      return NextResponse.json(
        {
          error: `Please shorten your details (name ≤ ${MAX_NAME}, company ≤ ${MAX_COMPANY}, phone ≤ ${MAX_PHONE} characters).`,
        },
        { status: 400 },
      );
    }
    if (!/^\+?[\d\s\-().]{7,}$/.test(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone number." },
        { status: 400 },
      );
    }
    if (!isUuid(courseId)) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const admin = getSupabaseAdmin();

    const { data: course, error: courseError } = await admin
      .from("courses")
      .select("id, is_active, start_date")
      .eq("id", courseId)
      .maybeSingle();

    if (courseError) {
      console.error("[enroll:create] course lookup:", courseError);
      return NextResponse.json(
        { error: "Could not load this course. Please try again." },
        { status: 500 },
      );
    }
    if (!course || !course.is_active) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Save the learner's contact details on their profile. Only columns
    // guaranteed by db/enrollment-flow.sql are written.
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: user.id,
        full_name,
        company: company || null,
        phone,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      // Never leak the raw DB/schema error to the user.
      console.error("[enroll:create] profile upsert:", profileError);
      return NextResponse.json(
        { error: "Could not save your details. Please try again." },
        { status: 500 },
      );
    }

    // Reuse this learner's enrollment for the cohort currently on sale so a
    // retry after a cancelled Mobile Money prompt does not insert a second
    // row. A paid enrollment for an EARLIER class does not block enrolling
    // again. A pending row is moved onto the current cohort at payment time
    // by reserve_seat_for_payment (db/cohorts.sql).
    const { data: existingRows, error: existingError } = await admin
      .from("enrollments")
      .select("id, status, cohort_start")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .order("enrolled_at", { ascending: false })
      .limit(10);

    if (existingError) {
      console.error("[enroll:create] existing lookup:", existingError);
      return NextResponse.json(
        { error: "Could not start your enrollment. Please try again." },
        { status: 500 },
      );
    }

    // Match the date shown on the course page. A passed start_date rolls to
    // the next first Monday (Africa/Kampala); a future one is kept.
    const cohort = toISODate(advertisedCourseStart(course.start_date));
    let rows = existingRows ?? [];
    let choice = pickEnrollmentToReuse(rows, cohort);

    // A USSD cancel can leave the row awaiting_confirmation if the webhook
    // never arrived. Ask BroRacks before refusing a retry.
    if (choice.kind === "already" && choice.status === "awaiting_confirmation") {
      await reconcileEnrollmentById(admin, choice.id, { force: true });
      const { data: refreshed } = await admin
        .from("enrollments")
        .select("id, status, cohort_start")
        .eq("id", choice.id)
        .maybeSingle();
      if (refreshed) {
        rows = rows.map((row) => (row.id === refreshed.id ? refreshed : row));
        choice = pickEnrollmentToReuse(rows, cohort);
      }
    }

    if (choice.kind === "already") {
      return NextResponse.json({
        enrollmentId: choice.id,
        status: choice.status,
        alreadyEnrolled: true,
      });
    }

    if (choice.kind === "reuse") {
      if (choice.reset) {
        const { error: resetError } = await admin
          .from("enrollments")
          .update({ status: "pending", amount_paid: 0, stripe_session_id: null })
          .eq("id", choice.id)
          .eq("status", "cancelled");
        if (resetError) {
          console.error("[enroll:create] reuse reset:", resetError);
          return NextResponse.json(
            { error: "Could not start your enrollment. Please try again." },
            { status: 500 },
          );
        }
      }
      return NextResponse.json({
        enrollmentId: choice.id,
        status: "pending",
        alreadyEnrolled: false,
      });
    }

    const { data: created, error: insertError } = await admin
      .from("enrollments")
      .insert({
        user_id: user.id,
        course_id: courseId,
        status: "pending",
        amount_paid: 0,
      })
      .select("id")
      .single();

    if (insertError || !created) {
      console.error("[enroll:create] insert:", insertError);
      return NextResponse.json(
        { error: "Could not start your enrollment. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      enrollmentId: created.id,
      status: "pending",
      alreadyEnrolled: false,
    });
  } catch (e) {
    console.error("[enroll:create]", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
