// ---------------------------------------------------------------------------
// POST /api/webhooks/broracks — BroRacks collection status notifications.
//
// Security: the HMAC signature is verified (constant-time) over the RAW body
// before anything is parsed, and stale timestamps are rejected.
//
// Idempotency: BroRacks may deliver the same event more than once, and
// concurrently. Every status change here is a CONDITIONAL update
// (… WHERE status = 'awaiting_confirmation'), and emails are only sent by the
// delivery that actually performed the transition — so a duplicate can never
// double-confirm, double-email, or downgrade a confirmed enrollment.
//
// Response codes: 2xx = "handled, don't retry" (including events we
// deliberately ignore); 5xx = "transient failure, please retry".
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  verifyWebhookSignatureAny,
  getWebhookSecrets,
  isFreshTimestamp,
  shouldConfirmPayment,
  parseAmount,
  FAILED_COLLECTION_EVENTS,
} from "@/lib/webhook";
import {
  escapeHtml,
  getResendFrom,
  getResendNotificationsFrom,
  getStaffInbox,
  sendResendEmail,
} from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type WebhookEvent = {
  event?: string;
  data?: {
    reference?: string;
    amount?: number | string;
    currency?: string;
    phone_number?: string;
    reason?: string;
    message?: string;
  };
};

/** Alert staff about a payment that needs a human (money may have moved). */
async function alertStaff(subject: string, lines: Record<string, unknown>) {
  const staffTo = getStaffInbox();
  const rows = Object.entries(lines)
    .map(
      ([k, v]) =>
        `<tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 160px;">${escapeHtml(k)}</td><td>${escapeHtml(v ?? "")}</td></tr>`,
    )
    .join("");
  const res = await sendResendEmail({
    from: getResendNotificationsFrom(),
    to: staffTo,
    subject,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; color: #1e293b;">
        <h2 style="margin: 0 0 16px;">${escapeHtml(subject)}</h2>
        <p style="color: #475569;">Please review this payment in the admin dashboard / BroRacks portal.</p>
        <table style="width: 100%; font-size: 14px; color: #475569;">${rows}</table>
      </div>
    `,
  });
  if (!res.ok) {
    console.error("[broracks webhook] staff alert email failed:", res.error);
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const timestamp = req.headers.get("X-BroRacks-Timestamp") || "";
  const signature = req.headers.get("X-BroRacks-Signature") || "";

  if (!process.env.BRORACKS_WEBHOOK_SECRET?.trim()) {
    console.error("[broracks webhook] BRORACKS_WEBHOOK_SECRET missing");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Current secret, plus the previous one during an account/secret rotation.
  const secrets = getWebhookSecrets();
  if (!verifyWebhookSignatureAny({ secrets, timestamp, rawBody, signature })) {
    console.warn(
      `[broracks webhook] rejected: invalid signature (timestamp=${timestamp || "none"}, signature=${signature ? "present" : "missing"})`,
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!isFreshTimestamp(timestamp)) {
    console.warn(
      `[broracks webhook] rejected: stale/expired timestamp (${timestamp || "none"})`,
    );
    return NextResponse.json({ error: "Webhook expired" }, { status: 401 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    console.error("[broracks webhook] invalid JSON body:", e);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!event || typeof event !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdmin();

    if (event.event === "collection.success") {
      return await handleSuccess(admin, event);
    }

    if (event.event && FAILED_COLLECTION_EVENTS.has(event.event)) {
      return await handleFailure(admin, event);
    }

    console.log(
      `[broracks webhook] ignoring unhandled event type: ${event.event ?? "unknown"}`,
    );
    return NextResponse.json({ received: true });
  } catch (e) {
    // Unexpected failure (DB down, etc.). Log the real error and return 500 so
    // BroRacks retries rather than dropping a real payment event.
    console.error("[broracks webhook] unhandled error:", e);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// collection.success
// ---------------------------------------------------------------------------
async function handleSuccess(admin: SupabaseClient, event: WebhookEvent) {
  const reference = event.data?.reference;
  if (!reference) {
    console.warn("[broracks webhook] collection.success without reference");
    return NextResponse.json({ received: true });
  }

  const { data: enrollment, error: enrollErr } = await admin
    .from("enrollments")
    .select("id, user_id, status, amount_paid, course_id, courses (id, title)")
    .eq("stripe_session_id", reference)
    .maybeSingle();

  if (enrollErr) {
    // Transient DB problem — ask BroRacks to retry; the money has moved.
    console.error("[broracks webhook] enrollment query:", enrollErr);
    return NextResponse.json(
      { error: "Could not load enrollment" },
      { status: 500 },
    );
  }

  const collectedAmount = event.data?.amount;
  const parsedAmount = parseAmount(collectedAmount);
  const amountLabel =
    parsedAmount !== null
      ? `UGX ${parsedAmount.toLocaleString()}`
      : String(collectedAmount ?? "unknown");

  if (!enrollment) {
    // Money was collected but we can't match it: e.g. the learner switched to
    // cash (reference replaced) and then approved the prompt anyway, or the
    // reference failed to save. A human has to reconcile this.
    console.error(
      `[broracks webhook] PAYMENT RECEIVED FOR UNKNOWN REFERENCE ${reference} (${amountLabel})`,
    );
    await alertStaff(`Unmatched Mobile Money payment — ref ${reference}`, {
      Reference: reference,
      Amount: amountLabel,
      Phone: event.data?.phone_number ?? "",
      Note: "No enrollment has this reference. The learner may have switched to cash after starting a Mobile Money payment.",
    });
    return NextResponse.json({ received: true });
  }

  if (enrollment.status === "confirmed") {
    // Duplicate delivery — already handled.
    return NextResponse.json({ received: true });
  }

  const course = (
    Array.isArray(enrollment.courses) ? enrollment.courses[0] : enrollment.courses
  ) as { id: string; title: string } | null;
  const courseTitle = course?.title ?? "your course";

  if (enrollment.status !== "awaiting_confirmation") {
    // Paid, but the booking no longer holds a seat (cancelled after a failed
    // event, or reset by an admin). Don't silently take a seat without a
    // capacity check — flag it for a human.
    console.error(
      `[broracks webhook] payment ${reference} received for enrollment ${enrollment.id} in status '${enrollment.status}' — needs manual review`,
    );
    await alertStaff(`Payment received for a ${enrollment.status} booking — ref ${reference}`, {
      Reference: reference,
      Enrollment: enrollment.id,
      Course: courseTitle,
      Status: enrollment.status,
      Amount: amountLabel,
    });
    return NextResponse.json({ received: true });
  }

  // Verify the amount (and currency) actually collected matches what this
  // enrollment owed before confirming. `amount_paid` was set server-side from
  // lib/pricing at reservation time. On mismatch leave it for manual review.
  if (
    !shouldConfirmPayment(
      collectedAmount,
      Number(enrollment.amount_paid),
      event.data?.currency,
    )
  ) {
    console.error(
      `[broracks webhook] amount mismatch for ${reference}: collected ${collectedAmount} ${event.data?.currency ?? ""}, expected ${enrollment.amount_paid} UGX`,
    );
    await alertStaff(`Payment amount mismatch — ref ${reference}`, {
      Reference: reference,
      Enrollment: enrollment.id,
      Course: courseTitle,
      Collected: `${collectedAmount ?? ""} ${event.data?.currency ?? ""}`.trim(),
      Expected: `UGX ${Number(enrollment.amount_paid).toLocaleString()}`,
    });
    return NextResponse.json({ received: true });
  }

  // Conditional transition — only one delivery can win this update. The seat
  // was already counted in seats_taken at reservation time, so we do NOT
  // increment again here.
  const { data: confirmedRows, error: confirmError } = await admin
    .from("enrollments")
    .update({ status: "confirmed" })
    .eq("id", enrollment.id)
    .eq("status", "awaiting_confirmation")
    .eq("stripe_session_id", reference)
    .select("id");

  if (confirmError) {
    // Return 500 so BroRacks retries the webhook — the payment succeeded and
    // we must not lose the confirmation.
    console.error(
      `[broracks webhook] failed to confirm enrollment ${enrollment.id} for ref ${reference}:`,
      confirmError,
    );
    return NextResponse.json(
      { error: "Could not confirm enrollment" },
      { status: 500 },
    );
  }

  if (!confirmedRows || confirmedRows.length === 0) {
    // A concurrent delivery (or an admin) changed it first — nothing to do.
    console.log(
      `[broracks webhook] ${reference}: enrollment ${enrollment.id} already transitioned; skipping emails`,
    );
    return NextResponse.json({ received: true });
  }

  const { data: userData, error: userErr } =
    await admin.auth.admin.getUserById(enrollment.user_id);

  if (userErr || !userData.user?.email) {
    console.error(
      "[broracks webhook] could not load user email:",
      enrollment.user_id,
      userErr,
    );
    return NextResponse.json({ received: true });
  }

  const customerEmail = userData.user.email.trim();
  const title = escapeHtml(courseTitle);
  const refEsc = escapeHtml(reference);
  const amountEsc = escapeHtml(amountLabel);

  const mail = await sendResendEmail({
    from: getResendFrom(),
    to: customerEmail,
    subject: `Payment confirmed — ${courseTitle}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
        <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
          <h1 style="margin: 0; font-size: 22px;">You're enrolled ✓</h1>
          <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">NAM Quality Management Systems</p>
        </div>
        <p style="font-family: system-ui, sans-serif; color: #475569;">
          Your payment of <strong>${amountEsc}</strong> was received successfully.
          You are now enrolled in <strong>${title}</strong>.
        </p>
        <p style="font-family: system-ui, sans-serif; color: #475569;">
          We will be in touch with joining instructions. Reference: <strong>${refEsc}</strong>
        </p>
      </div>
    `,
  });

  if (!mail.ok) {
    console.error("[broracks webhook] confirmation email failed:", mail.error);
  }

  // Notify the admin/internal inbox that a seat was confirmed.
  const staffTo = getStaffInbox();
  const adminMail = await sendResendEmail({
    from: getResendNotificationsFrom(),
    to: staffTo,
    subject: `Payment confirmed — ${courseTitle} · ref ${reference}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; color: #1e293b;">
        <h2 style="margin: 0 0 16px;">Enrollment confirmed ✓</h2>
        <p style="color: #475569;">A Mobile Money payment succeeded and the seat is now assigned.</p>
        <table style="width: 100%; font-size: 14px; color: #475569;">
          <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 160px;">Course</td><td>${title}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Learner email</td><td>${escapeHtml(customerEmail)}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Amount</td><td>${amountEsc}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Reference</td><td>${refEsc}</td></tr>
        </table>
      </div>
    `,
  });
  if (!adminMail.ok) {
    console.error(
      "[broracks webhook] admin notification email failed:",
      adminMail.error,
    );
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// collection.failed / cancelled / expired
// ---------------------------------------------------------------------------
async function handleFailure(admin: SupabaseClient, event: WebhookEvent) {
  const reference = event.data?.reference;
  console.warn(
    `[broracks webhook] ${event.event} for ref ${reference ?? "none"}${event.data?.reason ? ` (${event.data.reason})` : ""}`,
  );
  if (!reference) return NextResponse.json({ received: true });

  // Cancel the booking and release its held seat — but ONLY while it is still
  // awaiting this payment. A confirmed enrollment is never downgraded, and an
  // out-of-order/duplicate failure after success is ignored.
  const { data: cancelled, error: cancelError } = await admin
    .from("enrollments")
    .update({ status: "cancelled" })
    .eq("stripe_session_id", reference)
    .eq("status", "awaiting_confirmation")
    .select("id, user_id, course_id, courses (title)");

  if (cancelError) {
    console.error(
      `[broracks webhook] could not cancel booking for ref ${reference}:`,
      cancelError,
    );
    return NextResponse.json(
      { error: "Could not cancel enrollment" },
      { status: 500 },
    );
  }

  for (const row of cancelled ?? []) {
    if (row.course_id) {
      const { error: seatErr } = await admin.rpc("recompute_course_seats", {
        p_course_id: row.course_id,
      });
      if (seatErr) {
        console.error("[broracks webhook] recompute seats failed:", seatErr);
      }
    }

    // Tell the learner (only the delivery that performed the cancel does).
    const course = (
      Array.isArray(row.courses) ? row.courses[0] : row.courses
    ) as { title: string } | null;
    const { data: userData } = await admin.auth.admin.getUserById(
      row.user_id as string,
    );
    const email = userData?.user?.email?.trim();
    if (email) {
      const title = escapeHtml(course?.title ?? "your course");
      const mail = await sendResendEmail({
        from: getResendFrom(),
        to: email,
        subject: `Your Mobile Money payment didn't go through — ${course?.title ?? "NAM QMS"}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
            <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
              <h1 style="margin: 0; font-size: 22px;">Payment not completed</h1>
              <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">NAM Quality Management Systems</p>
            </div>
            <p style="font-family: system-ui, sans-serif; color: #475569;">
              Your Mobile Money payment for <strong>${title}</strong> was declined, cancelled or timed out,
              so no money was taken and your seat has been released.
            </p>
            <p style="font-family: system-ui, sans-serif; color: #475569;">
              You can enroll again at any time, or contact us on WhatsApp at
              <a href="https://wa.me/256707068533" style="color: #0d9488;">+256 707 068 533</a>
              to pay by cash or bank transfer.
            </p>
          </div>
        `,
      });
      if (!mail.ok) {
        console.error("[broracks webhook] failure email failed:", mail.error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
