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
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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

    let body: {
      courseId?: string;
      full_name?: string;
      company?: string;
      phone?: string;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { courseId, full_name, company, phone } = body;

    if (!courseId || !full_name?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();

    const { data: course, error: courseError } = await admin
      .from("courses")
      .select("id, is_active")
      .eq("id", courseId)
      .single();

    if (courseError || !course || !course.is_active) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Save the learner's contact details on their profile. Only columns
    // guaranteed by db/enrollment-flow.sql are written.
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: user.id,
        full_name: full_name.trim(),
        company: company?.trim() || null,
        phone: phone.trim(),
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

    // Reuse an existing non-cancelled enrollment for this course so a student
    // who comes back doesn't stack duplicate rows.
    const { data: existing } = await admin
      .from("enrollments")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .neq("status", "cancelled")
      .order("enrolled_at", { ascending: false })
      .limit(1)
      .maybeSingle();

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
