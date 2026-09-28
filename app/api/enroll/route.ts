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
import { currentCohortStart } from "@/lib/schedule";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { cleanString, isUuid, readJsonObject } from "@/lib/validation";

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
      .select("id, is_active")
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
    // returning student doesn't stack duplicate rows. A paid enrollment for an
    // EARLIER class (older cohort_start) does not block enrolling again; an
    // unpaid (pending) one is reused and moved to the current cohort at payment
    // time by reserve_seat_for_payment (db/cohorts.sql).
    const { data: existingRows, error: existingError } = await admin
      .from("enrollments")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .neq("status", "cancelled")
      .order("enrolled_at", { ascending: false })
      .limit(10);

    if (existingError) {
      console.error("[enroll:create] existing lookup:", existingError);
      return NextResponse.json(
        { error: "Could not start your enrollment. Please try again." },
        { status: 500 },
      );
    }

    const cohort = currentCohortStart();
    const existing = (existingRows ?? []).find(
      (e: { status: string; cohort_start?: string | null }) =>
        e.status === "pending" ||
        // Before db/cohorts.sql runs there is no cohort_start: keep the old
        // behaviour (any held enrollment counts).
        e.cohort_start === undefined ||
        e.cohort_start === null ||
        String(e.cohort_start).slice(0, 10) >= cohort,
    ) as { id: string; status: string } | undefined;

    if (existing) {
      return NextResponse.json({
        enrollmentId: existing.id,
        status: existing.status,
        // Signals the UI to skip the payment step (already paid/confirmed).
        alreadyEnrolled: existing.status !== "pending",
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
