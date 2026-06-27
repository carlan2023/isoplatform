// ---------------------------------------------------------------------------
// Email service — thin wrapper around Resend (https://resend.com).
//
// Exposes small, composable primitives that the API routes use to build and
// send their own HTML emails:
//
//   escapeHtml(value)                 — escape user input before interpolation
//   getResendFrom()                   — client-facing "From" address
//   getResendNotificationsFrom()      — internal/staff-alert "From" address
//   sendResendEmail({ from, to, ... })— send one email, returns { ok, ... }
//
// Configuration (see .env.example):
//   RESEND_API_KEY              — required to actually send
//   RESEND_FROM                 — defaults to info@amqualitysystems.com
//   RESEND_NOTIFICATIONS_FROM   — defaults to RESEND_FROM
// ---------------------------------------------------------------------------

import { Resend } from "resend";

// ---------------------------------------------------------------------------
// Lazy Resend client.
//
// We do NOT construct this at module load: doing so would read/validate env
// during `next build`, where RESEND_API_KEY may be absent. Constructing on
// first send keeps the module import side-effect free and build-safe.
// ---------------------------------------------------------------------------
let cachedClient: Resend | null = null;

function getResendClient(): Resend {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  cachedClient = new Resend(apiKey);
  return cachedClient;
}

// ---------------------------------------------------------------------------
// "From" addresses
// ---------------------------------------------------------------------------

const DEFAULT_FROM = "info@amqualitysystems.com";

/** Address client-facing emails are sent from (auto-replies, confirmations). */
export function getResendFrom(): string {
  return process.env.RESEND_FROM?.trim() || DEFAULT_FROM;
}

/** Address internal/staff notification emails are sent from. */
export function getResendNotificationsFrom(): string {
  return process.env.RESEND_NOTIFICATIONS_FROM?.trim() || getResendFrom();
}

// ---------------------------------------------------------------------------
// HTML escaping — always run user-supplied values through this before
// interpolating them into an email template.
// ---------------------------------------------------------------------------

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

// ---------------------------------------------------------------------------
// Send a single email.
//
// Never throws — callers branch on `result.ok` so that a failed email does
// not abort the surrounding request (e.g. an enrollment whose payment has
// already been initiated).
// ---------------------------------------------------------------------------

export interface SendResendEmailParams {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
}

export type SendResendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string };

export async function sendResendEmail(
  params: SendResendEmailParams,
): Promise<SendResendEmailResult> {
  try {
    const { data, error } = await getResendClient().emails.send({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      return { ok: false, error: error.message || String(error) };
    }

    return { ok: true, id: data?.id ?? null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
