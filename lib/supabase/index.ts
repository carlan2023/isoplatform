// ---------------------------------------------------------------------------
// Barrel for @/lib/supabase
//
// Only the browser client and types are re-exported here so that importing
// "@/lib/supabase" is always safe from Client Components. Server-only modules
// must be imported directly:
//   Server Component / route (as the user): "@/lib/supabase/server"
//   Privileged / service role:              "@/lib/supabase-admin"
// ---------------------------------------------------------------------------

export { supabase } from "./client";
export type {
  Database,
  Course,
  Profile,
  Enrollment,
  EnrollmentStatus,
} from "./types";
