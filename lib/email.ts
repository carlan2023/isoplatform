// ---------------------------------------------------------------------------
// Email service — all transactional emails sent by the platform.
//
// Uses Resend (https://resend.com) for delivery.
// All templates live here so they are easy to update in one place.
//
// Usage:
//   import { sendConsultEnquiryEmails } from "@/lib/email"
//   await sendConsultEnquiryEmails({ name, company, email, phone, standard, message })
// ---------------------------------------------------------------------------

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// The address that receives internal notifications (set in your .env)
const NOTIFY_EMAIL = process.env.NOTIFICATION_EMAIL!;

// The address emails are sent FROM to clients
const FROM_CLIENT = "info@amqualitysystems.com";

// Used only for internal notifications during development / Resend onboarding
const FROM_INTERNAL = "onboarding@resend.dev";

// ---------------------------------------------------------------------------
// Shared HTML wrapper — keeps all emails visually consistent
// ---------------------------------------------------------------------------
function emailWrapper(bodyHtml: string): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
      ${bodyHtml}
    </div>
  `;
}

function emailHeader(title: string, subtitle: string): string {
  return `
    <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
      <h1 style="margin: 0; font-size: 22px;">${title}</h1>
      <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">${subtitle}</p>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// 1. Consulting enquiry emails
//    Sent when someone submits the ConsultForm on the homepage.
//    Sends two emails: one to you (notification) and one to the client (receipt).
// ---------------------------------------------------------------------------

interface ConsultEmailParams {
  name: string;
  company: string;
  email: string;
  phone: string;
  standard: string;
  message: string;
}

export async function sendConsultEnquiryEmails(
  params: ConsultEmailParams,
): Promise<void> {
  const { name, company, email, phone, standard, message } = params;

  // Email to you
  await resend.emails.send({
    from: FROM_INTERNAL,
    to: NOTIFY_EMAIL,
    subject: `New Consulting Enquiry — ${standard} — ${company}`,
    html: emailWrapper(`
      ${emailHeader("New Consulting Enquiry", "AM Quality Management Systems")}
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
    `),
  });

  // Email to client
  await resend.emails.send({
    from: FROM_CLIENT,
    to: email,
    subject: `We received your enquiry — AM Quality Management Systems`,
    html: emailWrapper(`
      ${emailHeader(`Thank you, ${name}`, "AM Quality Management Systems")}
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
    `),
  });
}

// ---------------------------------------------------------------------------
// 2. Enrollment request emails
//    Sent when someone submits an enrollment (payment initiated but not yet confirmed).
//    Sends two emails: one to you (notification) and one to the client (receipt).
// ---------------------------------------------------------------------------

interface EnrollmentEmailParams {
  name: string;
  company: string;
  email: string;
  phone: string;
  courseTitle: string;
  courseStandard: string;
  startDate: string; // Pre-formatted date string e.g. "Monday, 5 May 2025"
  durationDays: number;
  format: string;
  seatNumber: number;
  amountDue: number; // In UGX
}

export async function sendEnrollmentEmails(
  params: EnrollmentEmailParams,
): Promise<void> {
  const {
    name,
    company,
    email,
    phone,
    courseTitle,
    courseStandard,
    startDate,
    durationDays,
    format,
    seatNumber,
    amountDue,
  } = params;

  // Email to you
  await resend.emails.send({
    from: FROM_INTERNAL,
    to: NOTIFY_EMAIL,
    subject: `New Enrollment — ${courseTitle} · Seat ${seatNumber}`,
    html: emailWrapper(`
      ${emailHeader("New Enrollment Request", "AM Quality Management Systems")}
      <table style="width: 100%; font-family: system-ui, sans-serif; font-size: 14px; color: #475569;">
        <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b; width: 140px;">Course</td><td>${courseTitle}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Standard</td><td>${courseStandard}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Start Date</td><td>${startDate}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Seat Number</td><td>#${seatNumber}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Amount</td><td>UGX ${amountDue.toLocaleString()}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Name</td><td>${name}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Company</td><td>${company}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Email</td><td>${email}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Phone</td><td>${phone}</td></tr>
      </table>
    `),
  });

  // Email to client
  await resend.emails.send({
    from: FROM_CLIENT,
    to: email,
    subject: `Enrollment Request Received — ${courseTitle}`,
    html: emailWrapper(`
      ${emailHeader("Enrollment Request Received", "AM Quality Management Systems · ISO Lead Auditor Training")}
      <p style="font-family: system-ui, sans-serif; color: #475569;">Dear ${name},</p>
      <p style="font-family: system-ui, sans-serif; color: #475569;">
        Thank you for your enrollment request. Your seat has been reserved and our team will
        contact you within 24 hours with your invoice and payment instructions.
      </p>
      <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <h2 style="margin: 0 0 16px; font-size: 16px; color: #0f766e;">Your Enrollment Details</h2>
        <table style="width: 100%; font-family: system-ui, sans-serif; font-size: 14px; color: #475569;">
          <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Course</td><td>${courseTitle}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Standard</td><td>${courseStandard}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Start Date</td><td>${startDate}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Duration</td><td>${durationDays} days · ${format}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Seat Number</td><td style="color: #0d9488; font-weight: 700;">#${seatNumber}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Amount Due</td><td>UGX ${amountDue.toLocaleString()}</td></tr>
        </table>
      </div>
      <p style="font-family: system-ui, sans-serif; color: #475569;">
        Please keep this email for your records. Your seat number <strong>#${seatNumber}</strong>
        will be used for all correspondence regarding this enrollment.
      </p>
      <p style="font-family: system-ui, sans-serif; color: #475569;">
        Best regards,<br/>
        <strong>AM Quality Management Systems</strong><br/>
        ISO Lead Auditor Training
      </p>
    `),
  });
}

// ---------------------------------------------------------------------------
// 3. Payment confirmed email
//    Sent by the BroRacks webhook when Mobile Money payment is successful.
// ---------------------------------------------------------------------------

interface PaymentConfirmedEmailParams {
  email: string;
  name: string;
  courseTitle: string;
  amountPaid: number; // In UGX
  reference: string;
}

export async function sendPaymentConfirmedEmail(
  params: PaymentConfirmedEmailParams,
): Promise<void> {
  const { email, name, courseTitle, amountPaid, reference } = params;

  await resend.emails.send({
    from: FROM_CLIENT,
    to: email,
    subject: `Payment Confirmed — ${courseTitle}`,
    html: emailWrapper(`
      ${emailHeader("Enrollment Confirmed ✓", "AM Quality Management Systems")}
      <p style="font-family: system-ui, sans-serif; color: #475569;">Dear ${name},</p>
      <p style="font-family: system-ui, sans-serif; color: #475569;">
        Your payment of <strong>UGX ${amountPaid.toLocaleString()}</strong> was received successfully.
        You are now enrolled in <strong>${courseTitle}</strong>.
      </p>
      <p style="font-family: system-ui, sans-serif; color: #475569;">
        We will be in touch shortly with joining instructions.<br/>
        Reference: <strong>${reference}</strong>
      </p>
      <p style="font-family: system-ui, sans-serif; color: #475569;">
        Best regards,<br/>
        <strong>AM Quality Management Systems</strong>
      </p>
    `),
  });
}
