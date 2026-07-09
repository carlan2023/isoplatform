// ---------------------------------------------------------------------------
// Shared enrollment email helpers.
//
// The "reserve now, pay cash/bank transfer later" flow is reachable from two
// places — the initial /api/enroll/pay call (method: "offline") and the
// /api/enroll/switch-offline call (a learner who never received the Mobile
// Money prompt). Both send the same two emails, so the templates live here to
// stay in sync.
// ---------------------------------------------------------------------------

import {
  escapeHtml,
  getResendFrom,
  getResendNotificationsFrom,
  sendResendEmail,
} from "@/lib/email";

// Sentinel stored in the payment-reference column for cash/offline bookings so
// the admin dashboard can tell them apart from a real BroRacks reference.
export const OFFLINE_REF = "OFFLINE-CASH";

export interface OfflineReservationEmailParams {
  learnerEmail?: string | null;
  payerName?: string | null;
  courseTitle: string;
  amount: number;
  seatNumber?: number;
}

/**
 * Emails the learner (how to pay) and the internal inbox (a booking to
 * confirm). Never throws — email failures are logged, not surfaced, so a mail
 * hiccup can't undo a seat that's already reserved.
 */
export async function sendOfflineReservationEmails(
  params: OfflineReservationEmailParams,
): Promise<void> {
  const safeName = escapeHtml((params.payerName || "").trim());
  const safeTitle = escapeHtml(params.courseTitle);
  const amountLabel = `UGX ${params.amount.toLocaleString()}`;

  if (params.learnerEmail?.trim()) {
    const mail = await sendResendEmail({
      from: getResendFrom(),
      to: params.learnerEmail.trim(),
      subject: `Seat reserved — pay to confirm — ${params.courseTitle}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
          <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
            <h1 style="margin: 0; font-size: 22px;">Your seat is reserved</h1>
            <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">AM Quality Management Systems</p>
          </div>
          <p style="font-family: system-ui, sans-serif; color: #475569;">${safeName ? `Dear ${safeName},` : "Hello,"}</p>
          <p style="font-family: system-ui, sans-serif; color: #475569;">
            We've held your seat for <strong>${safeTitle}</strong>. To confirm it, please
            pay <strong>${escapeHtml(amountLabel)}</strong> by cash or bank transfer.
          </p>
          <p style="font-family: system-ui, sans-serif; color: #475569;">
            Contact us on WhatsApp at
            <a href="https://wa.me/256707068533" style="color: #0d9488;">+256 707 068 533</a>
            to arrange payment. Once we receive it, we'll confirm your seat by email.
          </p>
        </div>
      `,
    });
    if (!mail.ok) {
      console.error("[enroll:offline] learner email failed:", mail.error);
    }
  }

  const staffTo = process.env.NOTIFICATION_EMAIL?.trim();
  if (staffTo) {
    const seatLine =
      typeof params.seatNumber === "number" && params.seatNumber > 0
        ? `seat ${params.seatNumber} · `
        : "";
    const staff = await sendResendEmail({
      from: getResendNotificationsFrom(),
      to: staffTo,
      subject: `Offline/cash enrollment to confirm — ${params.courseTitle}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; color: #1e293b;">
          <h2 style="margin: 0 0 12px;">Cash / offline enrollment awaiting confirmation</h2>
          <p style="color: #475569;">
            <strong>${safeTitle}</strong> · ${seatLine}agreed ${escapeHtml(amountLabel)}<br/>
            Learner: ${escapeHtml(params.learnerEmail ?? "unknown")}
          </p>
          <p style="color: #475569;">Confirm it in the admin dashboard once payment is received.</p>
        </div>
      `,
    });
    if (!staff.ok) {
      console.error("[enroll:offline] staff email failed:", staff.error);
    }
  } else {
    console.warn(
      "[enroll:offline] NOTIFICATION_EMAIL not set — skipping staff email",
    );
  }
}
