import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { name, company, email, phone, standard, message } = await req.json();

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: process.env.NOTIFICATION_EMAIL!,
    subject: `New Consulting Enquiry — ${standard} — ${company}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
        <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
          <h1 style="margin: 0; font-size: 22px;">New Consulting Enquiry</h1>
          <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">AM Quality Management Systems</p>
        </div>
        <table style="width: 100%; font-family: system-ui, sans-serif; font-size: 14px; color: #475569;">
          <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 140px;">Name</td><td>${name}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Company</td><td>${company}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Email</td><td>${email}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Phone</td><td>${phone}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">ISO Standard</td><td>${standard}</td></tr>
        </table>
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 20px;">
          <p style="font-family: system-ui, sans-serif; font-size: 14px; color: #475569; margin: 0;">
            <strong>Message:</strong><br/>${message}
          </p>
        </div>
      </div>
    `,
  });

  // Auto-reply to client
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: `We received your enquiry — AM Quality Management Systems`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
        <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
          <h1 style="margin: 0; font-size: 22px;">Thank you, ${name}</h1>
          <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">AM Quality Management Systems</p>
        </div>
        <p style="font-family: system-ui, sans-serif; color: #475569;">
          We have received your enquiry regarding <strong>${standard}</strong> certification support. 
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

  return NextResponse.json({ success: true });
}
