import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  isFreshTimestamp,
  shouldConfirmPayment,
} from "@/lib/webhook";
import {
  escapeHtml,
  getResendFrom,
  getResendNotificationsFrom,
  sendResendEmail,
} from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const timestamp = req.headers.get("X-BroRacks-Timestamp") || "";
  const signature = req.headers.get("X-BroRacks-Signature") || "";

  const secret = process.env.BRORACKS_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[broracks webhook] BRORACKS_WEBHOOK_SECRET missing");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!verifyWebhookSignature({ secret, timestamp, rawBody, signature })) {
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

  let event: {
    event?: string;
    data?: {
      reference?: string;
      amount?: number;
      phone_number?: string;
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    console.error("[broracks webhook] invalid JSON body:", e);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
  const admin = getSupabaseAdmin();

  if (event.event === "collection.success") {
    const reference = event.data?.reference;
    if (!reference) {
      return NextResponse.json({ received: true });
    }

    const { data: enrollment, error: enrollErr } = await admin
      .from("enrollments")
      .select("*, courses(*)")
      .eq("stripe_session_id", reference)
      .maybeSingle();

    if (enrollErr) {
      console.error("[broracks webhook] enrollment query:", enrollErr);
      return NextResponse.json({ received: true });
    }

    if (!enrollment) {
      console.warn(
        "[broracks webhook] no enrollment for reference:",
        reference,
      );
      return NextResponse.json({ received: true });
    }

    if (enrollment.status === "confirmed") {
      return NextResponse.json({ received: true });
    }

    // Verify the amount actually collected matches what this enrollment owed
    // before confirming. If it doesn't, leave it pending for manual review.
    const collectedAmount = event.data?.amount;
    if (!shouldConfirmPayment(collectedAmount, enrollment.amount_paid)) {
      console.error(
        `[broracks webhook] amount mismatch for ${reference}: collected ${collectedAmount}, expected ${enrollment.amount_paid}`,
      );
      return NextResponse.json({ received: true });
    }

    const course = enrollment.courses as {
      id: string;
      title: string;
      seats_taken: number | null;
    } | null;

    if (!course?.id) {
      console.error("[broracks webhook] enrollment missing course");
      return NextResponse.json({ received: true });
    }

    // The seat was already counted in seats_taken at reservation time, so we do
    // NOT increment again here — confirming a pending booking doesn't change how
    // many seats are held.
    const { error: confirmError } = await admin
      .from("enrollments")
      .update({ status: "confirmed" })
      .eq("id", enrollment.id);

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
    const payAmount = event.data?.amount;
    const amountLabel =
      typeof payAmount === "number"
        ? escapeHtml(`UGX ${payAmount.toLocaleString()}`)
        : escapeHtml(String(payAmount ?? ""));

    const title = escapeHtml(course.title);
    const refEsc = escapeHtml(reference);

    const mail = await sendResendEmail({
      from: getResendFrom(),
      to: customerEmail,
      subject: `Payment confirmed — ${course.title}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
          <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
            <h1 style="margin: 0; font-size: 22px;">You're enrolled ✓</h1>
            <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">AM Quality Management Systems</p>
          </div>
          <p style="font-family: system-ui, sans-serif; color: #475569;">
            Your payment of <strong>${amountLabel}</strong> was received successfully.
            You are now enrolled in <strong>${title}</strong>.
          </p>
          <p style="font-family: system-ui, sans-serif; color: #475569;">
            We will be in touch with joining instructions. Reference: <strong>${refEsc}</strong>
          </p>
        </div>
      `,
    });

    if (!mail.ok) {
      console.error(
        "[broracks webhook] confirmation email failed:",
        mail.error,
      );
    }

    // Notify the admin/internal inbox that a seat was confirmed.
    const staffTo = process.env.NOTIFICATION_EMAIL?.trim();
    if (staffTo) {
      const adminMail = await sendResendEmail({
        from: getResendNotificationsFrom(),
        to: staffTo,
        subject: `Payment confirmed — ${course.title} · ref ${reference}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; color: #1e293b;">
            <h2 style="margin: 0 0 16px;">Enrollment confirmed ✓</h2>
            <p style="color: #475569;">A Mobile Money payment succeeded and the seat is now assigned.</p>
            <table style="width: 100%; font-size: 14px; color: #475569;">
              <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 160px;">Course</td><td>${title}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Learner email</td><td>${escapeHtml(customerEmail)}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Amount</td><td>${amountLabel}</td></tr>
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
    } else {
      console.warn(
        "[broracks webhook] NOTIFICATION_EMAIL not set — skipping admin email",
      );
    }
  }

  if (event.event === "collection.failed") {
    const reference = event.data?.reference;
    console.warn(
      `[broracks webhook] collection.failed for ref ${reference ?? "none"}`,
    );
    if (reference) {
      // Cancel the booking and release its held seat.
      const { data: cancelled, error: cancelError } = await admin
        .from("enrollments")
        .update({ status: "cancelled" })
        .eq("stripe_session_id", reference)
        .neq("status", "cancelled")
        .select("course_id")
        .maybeSingle();

      if (cancelError) {
        console.error(
          `[broracks webhook] could not cancel booking for ref ${reference}:`,
          cancelError,
        );
      }

      if (cancelled?.course_id) {
        await admin.rpc("recompute_course_seats", {
          p_course_id: cancelled.course_id,
        });
      }
    }
  }

  if (
    event.event !== "collection.success" &&
    event.event !== "collection.failed"
  ) {
    console.log(
      `[broracks webhook] ignoring unhandled event type: ${event.event ?? "unknown"}`,
    );
  }

  return NextResponse.json({ received: true });
  } catch (e) {
    // Unexpected failure (DB down, etc.). Log the real error and return 500 so
    // BroRacks retries rather than dropping a real payment event.
    console.error("[broracks webhook] unhandled error:", e);
    return NextResponse.json({ error: "Webhook processing failed" }, {
      status: 500,
    });
  }
}
