// ---------------------------------------------------------------------------
// Convenience re-exports. Prefer importing from the specific module:
//   Client Components / pages:  import { supabase } from "@/lib/supabase"
//   Server (as the user):       import { createSupabaseServerClient } from "@/lib/supabase/server"
//   Privileged (service role):  import { getSupabaseAdmin } from "@/lib/supabase-admin"
// ---------------------------------------------------------------------------

export { supabase } from "./supabase/client";
export type {
  Database,
  Course,
  Profile,
  Enrollment,
  EnrollmentStatus,
} from "./supabase/types";
