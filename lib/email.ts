import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Default “From”. Must match a domain that is **Verified** in the Resend dashboard.
 * If you only added `send.amqualitysystems.com` there, either verify `amqualitysystems.com`
 * as a separate domain (recommended for info@…) or set RESEND_FROM to an address on the verified domain.
 */
const DEFAULT_RESEND_FROM =
  "AM Quality Management Systems <info@amqualitysystems.com>";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Customer-facing sends (enrollment, payment confirmation, consult auto-reply). */
export function getResendFrom(): string {
  return process.env.RESEND_FROM?.trim() || DEFAULT_RESEND_FROM;
}

/** Staff / internal notifications. Falls back to the same default domain address. */
export function getResendNotificationsFrom(): string {
  return (
    process.env.RESEND_NOTIFICATIONS_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    DEFAULT_RESEND_FROM
  );
}

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

export async function sendResendEmail(params: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY) {
    console.error("[resend] RESEND_API_KEY is not set");
    return { ok: false, error: "Email not configured (RESEND_API_KEY)" };
  }

  const { data, error } = await resend.emails.send({
    from: params.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    console.error("[resend] send failed:", error);
    return { ok: false, error: error.message || JSON.stringify(error) };
  }

  const id = data?.id;
  if (!id) {
    console.error("[resend] missing id in response:", data);
    return { ok: false, error: "Resend returned no message id" };
  }

  return { ok: true, id };
}
