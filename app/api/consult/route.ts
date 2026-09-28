// ---------------------------------------------------------------------------
// POST /api/consult — consulting enquiry form.
//
// Emails the staff inbox (the part that matters) and then sends the applicant
// an auto-reply. If only the auto-reply fails, the enquiry has still reached
// us, so the request succeeds with a note rather than telling the applicant to
// resubmit (which would create duplicate enquiries).
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import {
  escapeHtml,
  getResendFrom,
  getResendNotificationsFrom,
  sendResendEmail,
} from "@/lib/email";
import { cleanString, isValidEmail, readJsonObject } from "@/lib/validation";

const LIMITS = {
  name: 120,
  company: 160,
  email: 254,
  phone: 30,
  standard: 120,
  message: 5000,
} as const;

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonObject(req);
    if (!body) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const name = cleanString(body.name, LIMITS.name);
    const company = cleanString(body.company, LIMITS.company);
    const email = cleanString(body.email, LIMITS.email);
    const phone = cleanString(body.phone, LIMITS.phone);
    const standard = cleanString(body.standard, LIMITS.standard);
    const message = cleanString(body.message, LIMITS.message);

    if (
      name === null ||
      company === null ||
      email === null ||
      phone === null ||
      standard === null ||
      message === null
    ) {
      return NextResponse.json(
        {
          error: `One of the fields is too long (message max ${LIMITS.message.toLocaleString()} characters).`,
        },
        { status: 400 },
      );
    }

    const missing: string[] = [];
    if (!name) missing.push("name");
    if (!email) missing.push("email");
    if (!standard) missing.push("standard");
    if (!message) missing.push("message");
    if (missing.length) {
      return NextResponse.json(
        { error: `Please fill in: ${missing.join(", ")}.` },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const staffTo = process.env.NOTIFICATION_EMAIL?.trim();
    const safe = {
      name: escapeHtml(name),
      company: escapeHtml(company),
      email: escapeHtml(email),
      phone: escapeHtml(phone),
      standard: escapeHtml(standard),
      message: escapeHtml(message).replace(/\n/g, "<br/>"),
    };

    // Header-safe subject: strip newlines from user-supplied parts.
    const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ");
    const staffSubject = company
      ? `New Consulting Enquiry — ${oneLine(standard)} — ${oneLine(company)}`
      : `New Consulting Enquiry — ${oneLine(standard)}`;

    if (staffTo) {
      const staff = await sendResendEmail({
        from: getResendNotificationsFrom(),
        to: staffTo,
        subject: staffSubject,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
            <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
              <h1 style="margin: 0; font-size: 22px;">New Consulting Enquiry</h1>
              <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">NAM Quality Management Systems</p>
            </div>
            <table style="width: 100%; font-family: system-ui, sans-serif; font-size: 14px; color: #475569;">
              <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 140px;">Name</td><td>${safe.name}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Company</td><td>${safe.company}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Email</td><td>${safe.email}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Phone</td><td>${safe.phone}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">ISO Standard</td><td>${safe.standard}</td></tr>
            </table>
            <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 20px;">
              <p style="font-family: system-ui, sans-serif; font-size: 14px; color: #475569; margin: 0;">
                <strong>Message:</strong><br/>${safe.message}
              </p>
            </div>
          </div>
        `,
      });
      if (!staff.ok) {
        console.error("[consult] staff email failed:", staff.error);
        return NextResponse.json(
          {
            error:
              "We couldn't send your enquiry just now. Please try again or message us on WhatsApp.",
          },
          { status: 502 },
        );
      }
    } else {
      // Without a staff inbox the enquiry would be lost — don't pretend it
      // was received.
      console.error("[consult] NOTIFICATION_EMAIL is not set — enquiry not delivered");
      return NextResponse.json(
        {
          error:
            "Our enquiry form is temporarily unavailable. Please message us on WhatsApp.",
        },
        { status: 503 },
      );
    }

    const reply = await sendResendEmail({
      from: getResendFrom(),
      to: email,
      subject: `We received your enquiry — NAM Quality Management Systems`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
          <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
            <h1 style="margin: 0; font-size: 22px;">Thank you, ${safe.name}</h1>
            <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">NAM Quality Management Systems</p>
          </div>
          <p style="font-family: system-ui, sans-serif; color: #475569;">
            We have received your enquiry regarding <strong>${safe.standard}</strong> certification support.
            Our team will review your requirements and get back to you within 24 hours.
          </p>
          <p style="font-family: system-ui, sans-serif; color: #475569;">
            In the meantime, feel free to reach us directly on WhatsApp at
            <a href="https://wa.me/256707068533" style="color: #0d9488;">+256 707 068 533</a>.
          </p>
          <p style="font-family: system-ui, sans-serif; color: #475569;">
            Best regards,<br/>
            <strong>NAM Quality Management Systems</strong><br/>
            A subsidiary of Alrena Group
          </p>
        </div>
      `,
    });

    if (!reply.ok) {
      // Staff already have the enquiry — succeed, but let the UI mention it.
      console.error("[consult] auto-reply failed:", reply.error);
      return NextResponse.json({
        success: true,
        confirmationEmailSent: false,
        note: "We received your enquiry, but couldn't send you a confirmation email. We'll still be in touch.",
      });
    }

    return NextResponse.json({ success: true, confirmationEmailSent: true });
  } catch (e) {
    console.error("[consult]", e);
    return NextResponse.json(
      { error: "Could not send your enquiry. Please try again or use WhatsApp." },
      { status: 500 },
    );
  }
}
