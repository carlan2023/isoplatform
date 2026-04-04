// ---------------------------------------------------------------------------
// Server client — use ONLY in API routes and Server Components.
//
// Uses the SERVICE ROLE key which bypasses Row-Level Security entirely.
// This is required for admin operations such as:
//   - supabaseServer.auth.admin.createUser()
//   - supabaseServer.auth.admin.listUsers()
//   - Any write that normal users shouldn't be able to trigger directly
//
// ⚠️  NEVER import this file from a Client Component or expose it to
//     the browser. The service role key grants unrestricted DB access.
// ---------------------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase server environment variables: " +
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
  );
}

export const supabaseServer = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      // Never persist a session server-side — each request is stateless.
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
