// ---------------------------------------------------------------------------
// Database types
// Reflects the Supabase schema used across the app.
// Update these when you run migrations.
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
  payment_reference: string | null;
  enrolled_at: string; // ISO timestamp
  // Joined relations (populated via .select('*, courses(*)'))
  courses?: Course;
  profiles?: Profile;
}

// ---------------------------------------------------------------------------
// Convenience type for the full DB shape — passed to createClient<Database>
// so every query is type-safe.
// ---------------------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      courses: {
        Row: Course;
        Insert: Omit<Course, "id">;
        Update: Partial<Omit<Course, "id">>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "id"> & { id: string };
        Update: Partial<Omit<Profile, "id">>;
      };
      enrollments: {
        Row: Enrollment;
        Insert: Omit<Enrollment, "id" | "enrolled_at" | "courses" | "profiles">;
        Update: Partial<
          Omit<Enrollment, "id" | "enrolled_at" | "courses" | "profiles">
        >;
      };
    };
  };
}
