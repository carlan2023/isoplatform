// ---------------------------------------------------------------------------
// Browser client — safe to use in Client Components and pages.
//
// Uses the PUBLIC anon key. Supabase Row-Level Security (RLS) policies
// control what this client can read/write. Never put the service role
// key here — it would be exposed to every visitor.
// ---------------------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: " +
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.",
  );
}

// Singleton — one client instance shared across the browser session.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
