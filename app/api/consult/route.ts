import { NextRequest, NextResponse } from "next/server";
import {
  escapeHtml,
  getResendFrom,
  getResendNotificationsFrom,
  sendResendEmail,
} from "@/lib/email";

export async function POST(req: NextRequest) {
  const {
    name,
    company,
    email,
    phone,
    standard,
    message,
  } = await req.json();

  if (!name || !email || !standard || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const staffTo = process.env.NOTIFICATION_EMAIL?.trim();
  const safe = {
    name: escapeHtml(String(name)),
    company: escapeHtml(String(company ?? "")),
    email: escapeHtml(String(email)),
    phone: escapeHtml(String(phone ?? "")),
    standard: escapeHtml(String(standard)),
    message: escapeHtml(String(message)).replace(/\n/g, "<br/>"),
  };

  if (staffTo) {
    const staff = await sendResendEmail({
      from: getResendNotificationsFrom(),
      to: staffTo,
      subject: `New Consulting Enquiry — ${standard} — ${company}`,
      html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
        <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
          <h1 style="margin: 0; font-size: 22px;">New Consulting Enquiry</h1>
          <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">AM Quality Management Systems</p>
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
        { error: "Could not send enquiry. Try again or use WhatsApp." },
        { status: 502 },
      );
    }
  } else {
    console.warn("[consult] NOTIFICATION_EMAIL is not set");
  }

  const reply = await sendResendEmail({
    from: getResendFrom(),
    to: String(email).trim(),
    subject: `We received your enquiry — AM Quality Management Systems`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
        <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
          <h1 style="margin: 0; font-size: 22px;">Thank you, ${safe.name}</h1>
          <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">AM Quality Management Systems</p>
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
          <strong>AM Quality Management Systems</strong><br/>
          A subsidiary of Alrena Group
        </p>
      </div>
    `,
  });

  if (!reply.ok) {
    console.error("[consult] auto-reply failed:", reply.error);
    return NextResponse.json(
      {
        error:
          "We received your enquiry but could not send a confirmation email. Check spam or contact us on WhatsApp.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
