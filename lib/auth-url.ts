// ---------------------------------------------------------------------------
// Public origin used in auth email links.
//
// Password-reset emails must send people back to this site's /reset-password.
// Set NEXT_PUBLIC_BASE_URL to the origin that matches the Supabase Site URL
// and redirect allow-list (no trailing slash). When it is unset, links use
// the canonical production origin.
//
// Dashboard settings this depends on are noted in the pull request: Site URL,
// redirect URL allow-list, and the reset-password email template.
// ---------------------------------------------------------------------------

import { isValidEmail } from "./validation";

export const CANONICAL_BASE_URL = "https://www.amqualitysystems.com";

/** Origin for auth redirects, with no trailing slash. */
export function publicBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  const base = configured ? configured : CANONICAL_BASE_URL;
  return base.replace(/\/+$/, "");
}

/** Absolute URL Supabase should send password-reset emails back to. */
export function resetPasswordRedirectTo(): string {
  return `${publicBaseUrl()}/reset-password`;
}

/** Login-page link. Prefills a valid address and ignores anything else. */
export function forgotPasswordHref(email: string): string {
  const trimmed = email.trim();
  if (!isValidEmail(trimmed)) return "/forgot-password";
  return `/forgot-password?email=${encodeURIComponent(trimmed)}`;
}
