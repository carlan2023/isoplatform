// ---------------------------------------------------------------------------
// Admin client — SERVER ONLY.
//
// Uses the SERVICE ROLE key which bypasses Row-Level Security entirely. Use it
// only inside API routes / Server Components for trusted operations:
//   - auth.admin.createUser() / listUsers() / getUserById()
//   - writes that normal users must not be able to trigger directly
//   - reads of public data during static rendering (no cookies => ISR-safe)
//
// The "server-only" import makes any accidental import from a Client Component
// fail the build. The client is created lazily so a missing key never crashes
// an unrelated build step — it only throws when admin access is actually used.
// ---------------------------------------------------------------------------

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin env vars: NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY are required for server-side admin access.",
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cached;
}
