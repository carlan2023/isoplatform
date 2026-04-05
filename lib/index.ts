// ---------------------------------------------------------------------------
// Barrel export for lib/supabase
//
// Import guide:
//   Client Components / pages:       import { supabase } from "@/lib/supabase"
//   API routes / Server Components:  import { supabaseServer } from "@/lib/supabase"
//   Type imports:                    import type { Course, Enrollment } from "@/lib/supabase"
// ---------------------------------------------------------------------------

export { supabase } from "./supabase/client";
export { supabaseServer } from "./supabase/server";
export type {
  Database,
  Course,
  Profile,
  Enrollment,
  EnrollmentStatus,
} from "./supabase/types";
