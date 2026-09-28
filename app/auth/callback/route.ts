// ---------------------------------------------------------------------------
// Auth callback — completes email-confirmation and magic-link sign in.
//
// Supabase sends the user an email whose link points back here with a one-time
// `code`. We exchange that code for a session (PKCE), which sets the auth
// cookies, then redirect the user on. Without this route the email link cannot
// establish a session and the user appears "stuck" after clicking it.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/redirect";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Only allow relative in-app redirects (avoid open-redirect via ?redirect=).
  const redirect = safeRedirectPath(searchParams.get("redirect"), "/dashboard");

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${redirect}`);
      }
      console.error("[auth/callback] exchange failed:", error.message);
    } catch (e) {
      console.error("[auth/callback] exchange threw:", e);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "We couldn't verify that link. It may have expired — please try again.",
    )}`,
  );
}
