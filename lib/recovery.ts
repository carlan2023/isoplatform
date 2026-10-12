// ---------------------------------------------------------------------------
// Password-recovery link classification.
//
// Supabase can land on /reset-password in two ways, depending on the email
// template and the PKCE flow this app already uses (see /auth/callback):
//
//   1. PKCE — `?code=` is exchanged with exchangeCodeForSession. The browser
//      that requested the reset holds the code verifier cookie.
//   2. Token hash — `?token_hash=&type=recovery` is verified with verifyOtp.
//      This works when the link is opened on a different device. Point the
//      reset email template at:
//        {{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery
//
// Anything else (expired-link errors, a non-recovery token, an implicit
// access_token hash) is rejected. The signed-in session is not treated as a
// recovery session in those cases.
// ---------------------------------------------------------------------------

export const RESET_EMAIL_NOTICE =
  "If an account exists, we've emailed a link to reset your password.";

export const RECOVERY_LINK_ERROR =
  "We couldn't verify that link. It may have expired — please request a new one.";

export const PASSWORD_UPDATED_NOTICE =
  "Your password has been updated. Sign in with your new password.";

export type RecoveryLink =
  | { method: "pkce"; code: string }
  | { method: "token_hash"; tokenHash: string }
  | { method: "session" }
  | { method: "reject" };

/**
 * User-facing copy for a reset-email request. The argument is ignored on
 * purpose: success and failure must look the same, so the response cannot
 * reveal whether an account exists.
 */
export function forgotPasswordMessage(error?: string | null): string {
  // Accepted and discarded. Callers may pass the Supabase error so there is
  // no branch that could reveal whether the address is registered.
  void error;
  return RESET_EMAIL_NOTICE;
}

function clean(value: string | null): string {
  return value?.trim() ?? "";
}

/**
 * Classify a recovery redirect. `search` is the query string (with or without
 * "?"); `hash` is the fragment (with or without "#").
 */
export function describeRecoveryLink(search: string, hash = ""): RecoveryLink {
  const params = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));

  const code = clean(params.get("code"));
  if (code) return { method: "pkce", code };

  const tokenHash = clean(
    params.get("token_hash") ?? hashParams.get("token_hash"),
  );
  const type = clean(
    params.get("type") ?? hashParams.get("type"),
  ).toLowerCase();
  if (tokenHash) {
    if (type && type !== "recovery") return { method: "reject" };
    return { method: "token_hash", tokenHash };
  }

  const error =
    clean(params.get("error")) ||
    clean(params.get("error_code")) ||
    clean(params.get("error_description")) ||
    clean(hashParams.get("error")) ||
    clean(hashParams.get("error_code")) ||
    clean(hashParams.get("error_description"));
  if (error) return { method: "reject" };

  // Implicit-grant hashes are not used by this PKCE client. Don't fall
  // through to whatever session happens to already be signed in.
  if (clean(hashParams.get("access_token"))) return { method: "reject" };

  return { method: "session" };
}

/**
 * True when middleware should exchange the link and redirect to a clean
 * /reset-password. Error queries are not exchanged — redirecting those again
 * would loop.
 */
export function shouldEstablishRecoveryOnServer(link: RecoveryLink): boolean {
  return link.method === "pkce" || link.method === "token_hash";
}
