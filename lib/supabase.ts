// ---------------------------------------------------------------------------
// ⚠️  This file is kept for backwards compatibility only.
// All imports still resolve correctly via the re-exports below.
//
// Prefer importing directly from the specific module going forward:
//   Client Components:  import { supabase } from "@/lib/supabase/client"
//   API routes:         import { supabaseServer } from "@/lib/supabase/server"
//   Types:              import type { Course } from "@/lib/supabase/types"
// ---------------------------------------------------------------------------

export { supabase, supabaseServer } from "./index";
export type {
  Database,
  Course,
  Profile,
  Enrollment,
  EnrollmentStatus,
} from "./supabase/types";
