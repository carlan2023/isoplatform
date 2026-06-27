import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  escapeHtml,
  getResendFrom,
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

  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

  // Constant-time comparison to avoid leaking the signature via timing.
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  const signatureValid =
    expectedBuf.length === signatureBuf.length &&
    crypto.timingSafeEqual(expectedBuf, signatureBuf);

  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
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
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

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
    if (
      typeof collectedAmount === "number" &&
      Number.isFinite(collectedAmount) &&
      collectedAmount !== enrollment.amount_paid
    ) {
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
    await admin
      .from("enrollments")
      .update({ status: "confirmed" })
      .eq("id", enrollment.id);

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
  }

  if (event.event === "collection.failed") {
    const reference = event.data?.reference;
    if (reference) {
      // Cancel the booking and release its held seat.
      const { data: cancelled } = await admin
        .from("enrollments")
        .update({ status: "cancelled" })
        .eq("stripe_session_id", reference)
        .neq("status", "cancelled")
        .select("course_id")
        .maybeSingle();

      if (cancelled?.course_id) {
        await admin.rpc("recompute_course_seats", {
          p_course_id: cancelled.course_id,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
