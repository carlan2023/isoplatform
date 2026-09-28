import { NextRequest, NextResponse } from "next/server";
import {
  getResendFrom,
  getResendNotificationsFrom,
  sendResendEmail,
} from "@/lib/email";
import {
  buildApplicantEmail,
  buildStaffEmail,
  generateReference,
  isHoneypotTripped,
  validateApplication,
} from "@/lib/application";
import { CONTACT } from "@/lib/site";

// ---------------------------------------------------------------------------
// POST /api/apply — ISO certification application.
//
// Validates the application, emails the full breakdown to staff (so they can
// prepare a quotation) and sends the applicant a confirmation.
//
// Env: NOTIFICATION_EMAIL (staff inbox; falls back to CONTACT.email),
//      RESEND_API_KEY, RESEND_FROM, RESEND_NOTIFICATIONS_FROM.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Best-effort rate limiting: 5 submissions per IP per 10 minutes.
//
// State lives in module memory, so it is PER SERVER INSTANCE — on serverless
// hosting each warm instance keeps its own counters and a cold start resets
// them. It only blunts casual abuse; use a shared store (e.g. Upstash/Redis)
// if stronger guarantees are ever needed.
// ---------------------------------------------------------------------------
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function rateLimited(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);

  // Keep the map from growing without bound.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    if (rateLimited(clientIp(req))) {
      return NextResponse.json(
        {
          error:
            "Too many applications from your connection. Please wait a few minutes or contact us on WhatsApp.",
        },
        { status: 429, headers: { "Retry-After": String(RATE_WINDOW_MS / 1000) } },
      );
    }

    // Bots fill the hidden honeypot — pretend success, send nothing.
    if (isHoneypotTripped(body)) {
      return NextResponse.json({ success: true, reference: generateReference() });
    }

    const result = validateApplication(body);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: "Please correct the highlighted fields.",
          fieldErrors: result.errors,
        },
        { status: 400 },
      );
    }

    const data = result.data;
    const reference = generateReference();

    let staffTo = process.env.NOTIFICATION_EMAIL?.trim();
    if (!staffTo) {
      console.warn(
        `[apply] NOTIFICATION_EMAIL is not set — sending application to ${CONTACT.email}`,
      );
      staffTo = CONTACT.email;
    }

    const staffEmail = buildStaffEmail(data, reference);
    const staff = await sendResendEmail({
      from: getResendNotificationsFrom(),
      to: staffTo,
      replyTo: data.email,
      subject: staffEmail.subject,
      html: staffEmail.html,
      text: staffEmail.text,
    });
    if (!staff.ok) {
      console.error("[apply] staff email failed:", reference, staff.error);
      return NextResponse.json(
        {
          error:
            "We couldn't submit your application just now. Please try again, or send us your details on WhatsApp.",
        },
        { status: 502 },
      );
    }

    const applicantEmail = buildApplicantEmail(data, reference);
    const reply = await sendResendEmail({
      from: getResendFrom(),
      to: data.email,
      subject: applicantEmail.subject,
      html: applicantEmail.html,
      text: applicantEmail.text,
    });
    if (!reply.ok) {
      // The application reached staff, so this is still a success.
      console.error("[apply] confirmation email failed:", reference, reply.error);
      return NextResponse.json({
        success: true,
        reference,
        confirmationSent: false,
      });
    }

    return NextResponse.json({ success: true, reference, confirmationSent: true });
  } catch (e) {
    console.error("[apply]", e);
    return NextResponse.json(
      {
        error:
          "Could not submit your application. Please try again or contact us on WhatsApp.",
      },
      { status: 500 },
    );
  }
}
