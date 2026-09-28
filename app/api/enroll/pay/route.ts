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
//
// Amounts: the client only chooses the team size and how much to pay now. The
// price itself always comes from lib/pricing on the server, and the amount is
// range-checked against it before anything is charged.
//
// Concurrency: a double-click / two tabs must never start two charges for one
// enrollment. Before reserving, the request stamps a unique claim token into
// the payment-reference column (only while the enrollment is still 'pending').
// After the seat is reserved it re-reads the column; only the request whose
// token is still there proceeds — any other gets a 409.
// ---------------------------------------------------------------------------

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  BroRacksRejectedError,
  BroRacksTimeoutError,
  initiateCollection,
} from "@/lib/broracks";
import { computePricing, isValidPayAmount, MAX_TEAM_SIZE } from "@/lib/pricing";
import { normalizeUgandaMobile } from "@/lib/phone";
import { cleanString, isUuid, readJsonObject } from "@/lib/validation";
import { escapeHtml, getResendFrom, sendResendEmail } from "@/lib/email";
import {
  OFFLINE_REF,
  sendOfflineReservationEmails,
} from "@/lib/enrollment-emails";

const CLAIM_PREFIX = "CLAIM-";

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

    const method = body.method === "offline" ? "offline" : "momo";
    const enrollmentId = body.enrollmentId;
    const payerName = cleanString(body.payerName, 120);

    if (!isUuid(enrollmentId)) {
      return NextResponse.json(
        { error: "Missing or invalid enrollment reference." },
        { status: 400 },
      );
    }
    if (payerName === null) {
      return NextResponse.json(
        { error: "Name is too long (max 120 characters)." },
        { status: 400 },
      );
    }

    let momoPhone: string | null = null;
    if (method === "momo") {
      const rawPhone = typeof body.momoPhone === "string" ? body.momoPhone : "";
      if (!rawPhone.trim()) {
        return NextResponse.json(
          { error: "Enter the Mobile Money number to charge." },
          { status: 400 },
        );
      }
      momoPhone = normalizeUgandaMobile(rawPhone);
      if (!momoPhone) {
        return NextResponse.json(
          {
            error:
              "Enter a valid MTN or Airtel Uganda number, e.g. 0771234567 or +256771234567.",
          },
          { status: 400 },
        );
      }
    }

    const rawTeamSize = Number(body.teamSize ?? 1);
    if (
      !Number.isInteger(rawTeamSize) ||
      rawTeamSize < 1 ||
      rawTeamSize > MAX_TEAM_SIZE
    ) {
      return NextResponse.json(
        { error: `Number of participants must be between 1 and ${MAX_TEAM_SIZE}.` },
        { status: 400 },
      );
    }

    const rawAmount = body.amount;
    if (typeof rawAmount !== "number" || !Number.isFinite(rawAmount)) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 },
      );
    }

    // Server-side pricing is the source of truth.
    const amount = Math.round(rawAmount);
    const { team, fullAmount, minDeposit } = computePricing(rawTeamSize);

    // The client also sends the total it displayed; if it disagrees the page
    // is showing stale prices, so refuse rather than charge something else.
    if (
      body.fullAmount !== undefined &&
      Math.round(Number(body.fullAmount)) !== fullAmount
    ) {
      return NextResponse.json(
        {
          error:
            "Prices have changed since this page loaded. Please refresh and try again.",
        },
        { status: 400 },
      );
    }

    if (amount < 1 || !isValidPayAmount(amount, fullAmount, minDeposit)) {
      return NextResponse.json(
        {
          error: `Pay between UGX ${minDeposit.toLocaleString()} and UGX ${fullAmount.toLocaleString()} for this booking.`,
        },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();

    const { data: enrollment, error: enrollError } = await admin
      .from("enrollments")
      .select("id, user_id, status, course_id, courses (*)")
      .eq("id", enrollmentId)
      .maybeSingle();

    if (enrollError) {
      console.error("[enroll:pay] enrollment lookup failed:", enrollError);
      return NextResponse.json(
        { error: "Could not load your booking. Please try again." },
        { status: 500 },
      );
    }

    if (!enrollment || enrollment.user_id !== user.id) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 },
      );
    }

    if (enrollment.status !== "pending") {
      return NextResponse.json(
        {
          error:
            enrollment.status === "confirmed"
              ? "This enrollment is already confirmed. Check your dashboard."
              : enrollment.status === "cancelled"
                ? "This booking was cancelled. Please start a new enrollment."
                : "This enrollment already has a payment in progress. Check your dashboard.",
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
    ) as {
      id: string;
      title: string;
      standard: string | null;
      is_active?: boolean | null;
    } | null;

    if (!course?.id || course.is_active === false) {
      return NextResponse.json(
        { error: "This course is no longer open for enrollment." },
        { status: 404 },
      );
    }

    // Claim the enrollment for this request (see header comment).
    const claimToken = `${CLAIM_PREFIX}${randomUUID()}`;
    const { data: claimed, error: claimError } = await admin
      .from("enrollments")
      .update({ stripe_session_id: claimToken })
      .eq("id", enrollmentId)
      .eq("status", "pending")
      .select("id");

    if (claimError) {
      console.error("[enroll:pay] claim failed:", claimError);
      return NextResponse.json(
        { error: "Could not start your payment. Please try again." },
        { status: 500 },
      );
    }
    if (!claimed || claimed.length === 0) {
      return NextResponse.json(
        {
          error:
            "This enrollment already has a payment in progress. Check your dashboard.",
        },
        { status: 409 },
      );
    }

    // Hold a seat: pending -> awaiting_confirmation, capacity-checked atomically.
    const { data: reservation, error: reserveError } = await admin.rpc(
      "reserve_seat_for_payment",
      { p_enrollment_id: enrollmentId, p_amount: amount },
    );

    if (reserveError) {
      // Drop our claim so the booking is clean for the next attempt.
      await admin
        .from("enrollments")
        .update({ stripe_session_id: null })
        .eq("id", enrollmentId)
        .eq("status", "pending")
        .eq("stripe_session_id", claimToken);

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

    // Only the request that still owns the claim may take payment.
    const { data: owner, error: ownerError } = await admin
      .from("enrollments")
      .select("stripe_session_id")
      .eq("id", enrollmentId)
      .maybeSingle();

    if (ownerError || owner?.stripe_session_id !== claimToken) {
      if (ownerError) {
        console.error("[enroll:pay] claim re-check failed:", ownerError);
      }
      return NextResponse.json(
        {
          error:
            "This enrollment already has a payment in progress. Check your dashboard.",
        },
        { status: 409 },
      );
    }

    const reserved = Array.isArray(reservation) ? reservation[0] : reservation;
    const seatNumber: number = reserved?.seat_number ?? 0;

    const safeName = escapeHtml(payerName);
    const safeTitle = escapeHtml(String(course.title));

    // -----------------------------------------------------------------------
    // Offline / cash fallback — seat held, admin confirms once paid.
    // -----------------------------------------------------------------------
    if (method === "offline") {
      const { data: markedOffline, error: offlineRefError } = await admin
        .from("enrollments")
        .update({ stripe_session_id: OFFLINE_REF })
        .eq("id", enrollmentId)
        .eq("stripe_session_id", claimToken)
        .select("id");

      if (offlineRefError || !markedOffline || markedOffline.length === 0) {
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
    let reference = "";
    try {
      const collection = await initiateCollection({
        payerName: (payerName || user.email || "Learner").trim(),
        phoneNumber: momoPhone!,
        amount,
        description: `${course.standard ?? "Course"} · ${course.title} · seat ${seatNumber}`,
        // Tie the provider-side idempotency key to this claim, so a retry of
        // this exact attempt can never create a second charge.
        idempotencyKey: claimToken,
      });
      reference = collection.reference;
    } catch (e) {
      // Release the seat (only if this request still owns the booking).
      const { error: releaseError } = await admin
        .from("enrollments")
        .update({ status: "pending", amount_paid: 0, stripe_session_id: null })
        .eq("id", enrollmentId)
        .eq("status", "awaiting_confirmation")
        .eq("stripe_session_id", claimToken);
      if (releaseError) {
        console.error("[enroll:pay] seat release failed:", releaseError);
      }
      await admin.rpc("recompute_course_seats", {
        p_course_id: enrollment.course_id,
      });
      console.error("[enroll:pay] collection initiate failed; seat released:", e);

      const timedOut = e instanceof BroRacksTimeoutError;
      // BroRacks' own reason (e.g. "Invalid phone number") helps the learner
      // fix the problem; config/auth failures (4xx 401/403, 5xx) stay generic.
      const providerReason =
        e instanceof BroRacksRejectedError &&
        e.providerMessage &&
        e.status !== 401 &&
        e.status !== 403 &&
        (e.status ?? 0) < 500
          ? e.providerMessage
          : null;
      return NextResponse.json(
        {
          error: timedOut
            ? "Mobile Money is taking too long to respond. If a payment prompt still reaches your phone, please decline it — then try again or pay by cash / bank transfer."
            : providerReason
              ? `Mobile Money couldn't start the payment: ${providerReason}. Check the number and try again, or pay by cash / bank transfer.`
              : "We couldn't start the Mobile Money payment. Check the number and try again, or pay by cash / bank transfer.",
          // Tell the client an offline fallback is available.
          canPayOffline: true,
        },
        { status: timedOut ? 504 : 502 },
      );
    }

    // Link the payment reference so the webhook can match and confirm it.
    const { data: linked, error: refError } = await admin
      .from("enrollments")
      .update({ stripe_session_id: reference })
      .eq("id", enrollmentId)
      .eq("stripe_session_id", claimToken)
      .select("id");

    if (refError || !linked || linked.length === 0) {
      console.error(
        `[enroll:pay] could not store payment reference ${reference} for enrollment ${enrollmentId}:`,
        refError,
      );
      return NextResponse.json(
        {
          error:
            "Your payment prompt was sent, but we couldn't link it to your booking. Please contact us on WhatsApp with this reference before approving.",
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
              <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">NAM Quality Management Systems</p>
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

    return NextResponse.json({
      success: true,
      reference,
      team,
      amount,
      phone: momoPhone,
    });
  } catch (e) {
    console.error("[enroll:pay]", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
