// ---------------------------------------------------------------------------
// POST /api/enroll/pay — step 2 of enrollment: hold a seat and take payment.
//
// Two methods:
//   "momo" (default) — reserve a seat, then initiate a BroRacks Mobile Money
//                      prompt. The webhook confirms the seat on success.
//   "offline"        — reserve a seat WITHOUT charging (Mobile Money down /
//                      cash / bank transfer). The seat is held as
//                      awaiting_confirmation and an admin confirms once the
//                      money is received. This is the fallback for when the
//                      MTN/BroRacks API is failing.
//
// Either way the seat is held atomically first (capacity-checked); if the MoMo
// call then fails, the seat is released back to pending.
// ---------------------------------------------------------------------------

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { initiateCollection } from "@/lib/broracks";
import { computePricing, isValidPayAmount } from "@/lib/pricing";
import { escapeHtml, getResendFrom, sendResendEmail } from "@/lib/email";
import {
  OFFLINE_REF,
  sendOfflineReservationEmails,
} from "@/lib/enrollment-emails";

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

    let body: {
      enrollmentId?: string;
      teamSize?: number;
      amount?: number;
      fullAmount?: number;
      momoPhone?: string;
      payerName?: string;
      method?: string;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const {
      enrollmentId,
      teamSize: rawTeamSize,
      amount: rawAmount,
      fullAmount: rawFullAmount,
      momoPhone,
      payerName,
      method: rawMethod,
    } = body;

    const method = rawMethod === "offline" ? "offline" : "momo";

    if (!enrollmentId || (method === "momo" && !momoPhone?.trim())) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (
      typeof rawAmount !== "number" ||
      !Number.isFinite(rawAmount) ||
      typeof rawFullAmount !== "number" ||
      !Number.isFinite(rawFullAmount)
    ) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 },
      );
    }

    const amount = Math.round(rawAmount);
    const { team, fullAmount, minDeposit } = computePricing(
      Number(rawTeamSize) || 1,
    );

    if (fullAmount !== Math.round(rawFullAmount)) {
      return NextResponse.json(
        { error: "Price total does not match course pricing" },
        { status: 400 },
      );
    }

    if (amount < 1 || !isValidPayAmount(amount, fullAmount, minDeposit)) {
      return NextResponse.json(
        { error: "Payment amount is not allowed for this booking" },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();

    const { data: enrollment, error: enrollError } = await admin
      .from("enrollments")
      .select("id, user_id, status, course_id, courses (*)")
      .eq("id", enrollmentId)
      .maybeSingle();

    if (enrollError || !enrollment || enrollment.user_id !== user.id) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 },
      );
    }

    if (enrollment.status !== "pending") {
      return NextResponse.json(
        {
          error:
            "This enrollment already has a payment in progress. Check your dashboard.",
        },
        { status: 409 },
      );
    }

    // PostgREST embeds can come back as an object or a single-element array
    // depending on the relationship; normalise to one row.
    const course = (
      Array.isArray(enrollment.courses)
        ? enrollment.courses[0]
        : enrollment.courses
    ) as { id: string; title: string; standard: string | null } | null;

    if (!course?.id) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Hold a seat: pending -> awaiting_confirmation, capacity-checked atomically.
    const { data: reservation, error: reserveError } = await admin.rpc(
      "reserve_seat_for_payment",
      { p_enrollment_id: enrollmentId, p_amount: amount },
    );

    if (reserveError) {
      const msg = reserveError.message || "";
      if (msg.includes("COURSE_FULL")) {
        return NextResponse.json(
          { error: "This course is now full. Please choose another date." },
          { status: 409 },
        );
      }
      console.error("[enroll:pay] seat reservation failed:", reserveError);
      return NextResponse.json(
        { error: "Could not reserve a seat. Please try again." },
        { status: 500 },
      );
    }

    const reserved = Array.isArray(reservation) ? reservation[0] : reservation;
    const seatNumber: number = reserved?.seat_number ?? 0;

    const safeName = escapeHtml((payerName || "").trim());
    const safeTitle = escapeHtml(String(course.title));

    // -----------------------------------------------------------------------
    // Offline / cash fallback — seat held, admin confirms once paid.
    // -----------------------------------------------------------------------
    if (method === "offline") {
      const { error: offlineRefError } = await admin
        .from("enrollments")
        .update({ stripe_session_id: OFFLINE_REF })
        .eq("id", enrollmentId);

      if (offlineRefError) {
        console.error(
          "[enroll:pay] could not mark booking offline:",
          offlineRefError,
        );
        return NextResponse.json(
          {
            error:
              "Your seat is held, but we hit a snag saving it. Contact us on WhatsApp to confirm.",
          },
          { status: 500 },
        );
      }

      await sendOfflineReservationEmails({
        learnerEmail: user.email,
        payerName,
        courseTitle: course.title,
        amount,
        seatNumber,
      });

      return NextResponse.json({ success: true, offline: true, amount });
    }

    // -----------------------------------------------------------------------
    // Mobile Money path — start the prompt; release the seat if it can't start.
    // -----------------------------------------------------------------------
    const idempotencyKey = randomUUID();
    let reference = "";
    try {
      const collection = await initiateCollection({
        payerName: (payerName || user.email || "Learner").trim(),
        phoneNumber: momoPhone!.trim(),
        amount,
        description: `${course.standard ?? "Course"} · ${course.title} · seat ${seatNumber}`,
        idempotencyKey,
      });
      reference = collection.reference;
    } catch (e) {
      await admin
        .from("enrollments")
        .update({ status: "pending", amount_paid: 0 })
        .eq("id", enrollmentId);
      await admin.rpc("recompute_course_seats", {
        p_course_id: enrollment.course_id,
      });
      console.error("[enroll:pay] collection initiate failed; seat released:", e);
      return NextResponse.json(
        {
          error: "Could not start the Mobile Money payment. Please try again.",
          // Tell the client an offline fallback is available.
          canPayOffline: true,
        },
        { status: 502 },
      );
    }

    // Link the payment reference so the webhook can match and confirm it.
    const { error: refError } = await admin
      .from("enrollments")
      .update({ stripe_session_id: reference })
      .eq("id", enrollmentId);

    if (refError) {
      console.error("[enroll:pay] could not store payment reference:", refError);
      return NextResponse.json(
        {
          error:
            "Payment started but could not be linked. Contact support with your payment reference.",
          reference,
        },
        { status: 500 },
      );
    }

    if (user.email) {
      const mail = await sendResendEmail({
        from: getResendFrom(),
        to: user.email.trim(),
        subject: `Approve your Mobile Money payment — ${course.title}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
            <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
              <h1 style="margin: 0; font-size: 22px;">Approve payment on your phone</h1>
              <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">AM Quality Management Systems</p>
            </div>
            <p style="font-family: system-ui, sans-serif; color: #475569;">${safeName ? `Dear ${safeName},` : "Hello,"}</p>
            <p style="font-family: system-ui, sans-serif; color: #475569;">
              You started a Mobile Money payment of <strong>UGX ${amount.toLocaleString()}</strong>
              for <strong>${safeTitle}</strong>. Please approve the prompt on your phone.
              Your payment reference is <strong>${escapeHtml(reference)}</strong>.
            </p>
            <p style="font-family: system-ui, sans-serif; color: #475569;">
              Once the payment is confirmed, we'll email you and your seat will be reserved.
            </p>
          </div>
        `,
      });
      if (!mail.ok) {
        console.error("[enroll:pay] initiation email failed:", mail.error);
      }
    }

    return NextResponse.json({ success: true, reference, team });
  } catch (e) {
    console.error("[enroll:pay]", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
