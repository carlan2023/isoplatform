// ---------------------------------------------------------------------------
// Database types — reflects the Supabase schema used across the app.
// Update these when you run migrations.
//
// These are advisory: the runtime clients (browser / server / admin) are
// created without the <Database> generic today, so accessing query results is
// untyped. The `Database` shape below is kept conformant with the structure
// @supabase/supabase-js expects, so it can be passed to createClient<Database>()
// later to get end-to-end type safety without further changes.
// ---------------------------------------------------------------------------

export type EnrollmentStatus = "pending" | "confirmed" | "cancelled";

export interface Course {
  id: string;
  title: string;
  standard: string;
  description: string;
  start_date: string; // ISO date string
  duration_days: number;
  format: "in-person" | "virtual";
  seats_total: number;
  seats_taken: number;
  price_usd: number; // Stored as UGX despite the column name
  is_active: boolean;
}

export interface Profile {
  id: string; // matches auth.users.id
  full_name: string | null;
  name: string | null; // legacy column; some rows use this instead of full_name
  phone: string | null;
  company: string | null;
  role: "student" | "admin";
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  amount_paid: number;
  stripe_session_id: string | null; // BroRacks payment reference (legacy column name)
  enrolled_at: string; // ISO timestamp
  // Joined relations (populated via .select('*, courses(*)'))
  courses?: Course;
  profiles?: Profile;
}

// ---------------------------------------------------------------------------
// Full DB shape — conformant with the structure createClient<Database>()
// expects (Tables with Row/Insert/Update/Relationships, plus the empty
// Views/Functions/Enums/CompositeTypes maps).
// ---------------------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      courses: {
        Row: Course;
        Insert: Omit<Course, "id"> & { id?: string };
        Update: Partial<Course>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: { id: string } & Partial<Omit<Profile, "id">>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      enrollments: {
        Row: Enrollment;
        Insert: { user_id: string; course_id: string } & Partial<
          Omit<Enrollment, "user_id" | "course_id" | "courses" | "profiles">
        >;
        Update: Partial<Omit<Enrollment, "courses" | "profiles">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
