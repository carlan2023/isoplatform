// ---------------------------------------------------------------------------
// POST /api/enroll/switch-offline — convert an in-progress Mobile Money booking
// to cash / bank transfer.
//
// Used when a learner started a MoMo payment but never received the MTN/Airtel
// prompt. The seat is already held (awaiting_confirmation) from the initial
// /api/enroll/pay call, so we do NOT re-reserve — we only swap the payment
// reference to the offline sentinel (so a late MoMo webhook can't silently
// auto-confirm a booking the learner has chosen to pay in cash) and email the
// cash-payment instructions.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  OFFLINE_REF,
  sendOfflineReservationEmails,
} from "@/lib/enrollment-emails";
import { isUuid, readJsonObject } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to continue." },
        { status: 401 },
      );
    }

    const body = await readJsonObject(req);
    if (!body) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { enrollmentId } = body;
    if (!isUuid(enrollmentId)) {
      return NextResponse.json(
        { error: "Missing or invalid enrollment reference." },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();

    const { data: enrollment, error: enrollError } = await admin
      .from("enrollments")
      .select("id, user_id, status, amount_paid, stripe_session_id, courses (title)")
      .eq("id", enrollmentId)
      .maybeSingle();

    if (enrollError) {
      console.error("[enroll:switch-offline] lookup failed:", enrollError);
      return NextResponse.json(
        { error: "Could not load your booking. Please try again." },
        { status: 500 },
      );
    }

    if (!enrollment || enrollment.user_id !== user.id) {
      return NextResponse.json(
        { error: "Enrollment not found." },
        { status: 404 },
      );
    }

    if (enrollment.status === "confirmed") {
      return NextResponse.json(
        { error: "This payment is already confirmed. Check your dashboard." },
        { status: 409 },
      );
    }

    // A seat must already be held (i.e. a MoMo payment was started). If it's
    // still 'pending', the learner never initiated payment — they should use
    // the normal cash option on the payment step instead.
    if (enrollment.status !== "awaiting_confirmation") {
      return NextResponse.json(
        { error: "No payment in progress to switch. Please start again." },
        { status: 409 },
      );
    }

    // The pay request is still talking to the provider (see the claim token in
    // /api/enroll/pay) — switching now would orphan the reference it is about
    // to store.
    if (String(enrollment.stripe_session_id ?? "").startsWith("CLAIM-")) {
      return NextResponse.json(
        {
          error:
            "Your Mobile Money payment is still starting. Please wait a moment and try again.",
        },
        { status: 409 },
      );
    }

    const course = (
      Array.isArray(enrollment.courses)
        ? enrollment.courses[0]
        : enrollment.courses
    ) as { title: string } | null;
    const amount = Number(enrollment.amount_paid) || 0;

    // Idempotent: if it's already marked offline, just re-send instructions.
    if (enrollment.stripe_session_id !== OFFLINE_REF) {
      // Conditional on the booking still awaiting confirmation, so we never
      // touch one the MoMo webhook confirmed at the same moment.
      const { data: switched, error: updateError } = await admin
        .from("enrollments")
        .update({ stripe_session_id: OFFLINE_REF })
        .eq("id", enrollmentId)
        .eq("status", "awaiting_confirmation")
        .select("id");

      if (updateError) {
        console.error(
          "[enroll:switch-offline] could not mark booking offline:",
          updateError,
        );
        return NextResponse.json(
          {
            error:
              "Your seat is still held, but we couldn't switch to cash. Contact us on WhatsApp.",
          },
          { status: 500 },
        );
      }

      if (!switched || switched.length === 0) {
        return NextResponse.json(
          {
            error:
              "Your booking changed while switching — it may already be confirmed. Check your dashboard.",
          },
          { status: 409 },
        );
      }
    }

    await sendOfflineReservationEmails({
      learnerEmail: user.email,
      courseTitle: course?.title ?? "your course",
      amount,
    });

    return NextResponse.json({ success: true, offline: true, amount });
  } catch (e) {
    console.error("[enroll:switch-offline]", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
