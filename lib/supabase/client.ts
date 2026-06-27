// ---------------------------------------------------------------------------
// Browser client — safe to use in Client Components and pages.
//
// Uses the PUBLIC anon key with cookie-based session storage (@supabase/ssr).
// Cookie storage is what lets the server (middleware, Server Components, route
// handlers) read the signed-in user's session. Never put the service role key
// here — it would be exposed to every visitor. Privileged reads/writes must go
// through a server route backed by getSupabaseAdmin().
// ---------------------------------------------------------------------------

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: " +
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.",
  );
}

// Singleton browser client. @supabase/ssr keeps the session in cookies so it is
// shared with the server for authorization checks.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
