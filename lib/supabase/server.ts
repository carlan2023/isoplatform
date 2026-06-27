// ---------------------------------------------------------------------------
// Server client (per-request) — use in Server Components and Route Handlers
// that need to act AS THE SIGNED-IN USER (e.g. read the session, check role).
//
// Uses the PUBLIC anon key and reads/writes the auth cookies for the current
// request, so Row-Level Security applies. This is NOT the admin client — for
// privileged operations that must bypass RLS, use getSupabaseAdmin() from
// "@/lib/supabase-admin".
// ---------------------------------------------------------------------------

import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In a Server Component render this can throw (cookies are read-only);
          // it is safe to ignore because middleware refreshes the session.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // no-op
          }
        },
      },
    },
  );
}
