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

export type EnrollmentStatus =
  | "pending" // details captured, no payment yet — holds no seat
  | "awaiting_confirmation" // payment initiated — seat held, confirming
  | "confirmed" // payment confirmed — seat assigned
  | "cancelled";

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

export type GroupEnrollmentStatus = EnrollmentStatus;

/** Company booking for Internal Auditor Courses. See db/group-enrollments.sql. */
export interface GroupEnrollment {
  id: string;
  product: "internal-auditor";
  company_name: string;
  contact_name: string;
  contact_email: string;
  momo_phone: string;
  participant_count: number;
  per_person: number;
  amount: number;
  status: GroupEnrollmentStatus;
  payment_reference: string | null;
  created_at: string;
}

export interface GroupEnrollmentParticipant {
  id: string;
  group_enrollment_id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  amount_paid: number;
  stripe_session_id: string | null; // BroRacks payment reference (legacy column name)
  held_at?: string | null; // when the Mobile Money seat hold started
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
      group_enrollments: {
        Row: GroupEnrollment;
        Insert: {
          company_name: string;
          contact_name: string;
          contact_email: string;
          momo_phone: string;
          participant_count: number;
          per_person: number;
          amount: number;
        } & Partial<
          Omit<
            GroupEnrollment,
            | "company_name"
            | "contact_name"
            | "contact_email"
            | "momo_phone"
            | "participant_count"
            | "per_person"
            | "amount"
          >
        >;
        Update: Partial<GroupEnrollment>;
        Relationships: [];
      };
      group_enrollment_participants: {
        Row: GroupEnrollmentParticipant;
        Insert: {
          group_enrollment_id: string;
          full_name: string;
          email: string;
        } & Partial<
          Omit<GroupEnrollmentParticipant, "group_enrollment_id" | "full_name" | "email">
        >;
        Update: Partial<GroupEnrollmentParticipant>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
