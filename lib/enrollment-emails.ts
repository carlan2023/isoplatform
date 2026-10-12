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
  getStaffInbox,
  sendResendEmail,
} from "@/lib/email";
import { classStartLabel } from "@/lib/schedule";

// Sentinel stored in the payment-reference column for cash/offline bookings so
// the admin dashboard can tell them apart from a real BroRacks reference.
export const OFFLINE_REF = "OFFLINE-CASH";

export interface OfflineReservationEmailParams {
  learnerEmail?: string | null;
  payerName?: string | null;
  courseTitle: string;
  amount: number;
  seatNumber?: number;
  /** courses.start_date. A passed date is rolled to the next first Monday. */
  startDate?: string | null;
}

/** One sentence naming the class date, safe to drop into the existing emails. */
export function classStartEmailHtml(stored: string | null | undefined): string {
  const label = escapeHtml(classStartLabel(stored));
  return `<p style="font-family: system-ui, sans-serif; color: #475569;">The class starts on <strong>${label}</strong>.</p>`;
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
  const startHtml = classStartEmailHtml(params.startDate);

  if (params.learnerEmail?.trim()) {
    const mail = await sendResendEmail({
      from: getResendFrom(),
      to: params.learnerEmail.trim(),
      subject: `Seat reserved — pay to confirm — ${params.courseTitle}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
          <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
            <h1 style="margin: 0; font-size: 22px;">Your seat is reserved</h1>
            <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">NAM Quality Management Systems</p>
          </div>
          <p style="font-family: system-ui, sans-serif; color: #475569;">${safeName ? `Dear ${safeName},` : "Hello,"}</p>
          <p style="font-family: system-ui, sans-serif; color: #475569;">
            We've held your seat for <strong>${safeTitle}</strong>. To confirm it, please
            pay <strong>${escapeHtml(amountLabel)}</strong> by cash or bank transfer.
          </p>
          ${startHtml}
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

  const staffTo = getStaffInbox();
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
          Class start: ${escapeHtml(classStartLabel(params.startDate))}<br/>
          Learner: ${escapeHtml(params.learnerEmail ?? "unknown")}
        </p>
        <p style="color: #475569;">Confirm it in the admin dashboard once payment is received.</p>
      </div>
    `,
  });
  if (!staff.ok) {
    console.error("[enroll:offline] staff email failed:", staff.error);
  }
}

/** Learner email after a Mobile Money hold is cancelled and the seat released. */
export async function sendPaymentReleasedEmail(params: {
  learnerEmail?: string | null;
  courseTitle: string;
}): Promise<void> {
  const email = params.learnerEmail?.trim();
  if (!email) return;
  const title = escapeHtml(params.courseTitle);
  const mail = await sendResendEmail({
    from: getResendFrom(),
    to: email,
    subject: `Your Mobile Money payment didn't go through — ${params.courseTitle}`,
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
          You can try the payment again from your enrollment — you will not need to start a second booking —
          or contact us on WhatsApp at
          <a href="https://wa.me/256707068533" style="color: #0d9488;">+256 707 068 533</a>
          to pay by cash or bank transfer.
        </p>
      </div>
    `,
  });
  if (!mail.ok) {
    console.error("[enroll] payment-released email failed:", mail.error);
  }
}
