// ---------------------------------------------------------------------------
// Auth middleware — the server-side gate for protected areas.
//
// Runs on every request matched below. It (1) refreshes the Supabase session
// cookie so Server Components see a valid session, (2) exchanges password
// recovery links that land on /reset-password, and (3) enforces access:
//   - /dashboard/*  requires a signed-in user
//   - /admin/*      requires a signed-in user whose profile role is "admin"
//
// This is the real authorization boundary. The client-side checks in the page
// components are only for UX; they must never be relied on for security.
// ---------------------------------------------------------------------------

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  describeRecoveryLink,
  shouldEstablishRecoveryOnServer,
} from "@/lib/recovery";

type AuthCookie = { name: string; value: string; options?: CookieOptions };

function redirectWithAuthCookies(url: URL, cookiesToSet: Map<string, AuthCookie>) {
  const redirect = NextResponse.redirect(url);
  cookiesToSet.forEach(({ name, value, options }) => {
    redirect.cookies.set(name, value, options);
  });
  return redirect;
}

export async function middleware(request: NextRequest) {
  // Session cookies written while Supabase exchanges a recovery link or
  // refreshes a session. A redirect has to carry them itself — a new
  // NextResponse does not inherit cookies set on the previous one.
  const pendingCookies = new Map<string, AuthCookie>();

  // Response we will mutate cookies on as Supabase refreshes the session.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.set(name, { name, value, options });
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Password recovery lands on /reset-password with either a PKCE `code`
  // (same exchange as /auth/callback) or a `token_hash` from the email
  // template. Exchange it here, before the page's browser client loads, so
  // the one-time code is not consumed twice. Then redirect to a clean URL
  // with the session cookies attached.
  const { pathname } = request.nextUrl;
  if (pathname === "/reset-password") {
    const link = describeRecoveryLink(request.nextUrl.search);
    if (shouldEstablishRecoveryOnServer(link)) {
      let failed = false;
      try {
        if (link.method === "pkce") {
          const { error } = await supabase.auth.exchangeCodeForSession(link.code);
          if (error) {
            console.error("[reset-password] exchange failed:", error.message);
            failed = true;
          }
        } else if (link.method === "token_hash") {
          const { error } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: link.tokenHash,
          });
          if (error) {
            console.error("[reset-password] verify failed:", error.message);
            failed = true;
          }
        }
      } catch (e) {
        console.error("[reset-password] recovery exchange threw:", e);
        failed = true;
      }

      const url = request.nextUrl.clone();
      url.search = "";
      if (failed) url.searchParams.set("error", "invalid");
      return redirectWithAuthCookies(url, pendingCookies);
    }
  }

  // IMPORTANT: getUser() revalidates the token with Supabase. Do not trust
  // getSession() alone for authorization decisions.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const needsAuth =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (!user && needsAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Keep the original query string so the user lands exactly where they
    // were headed. The login page sanitises this value (lib/redirect.ts).
    url.search = "";
    url.searchParams.set("redirect", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/reset-password"],
};
