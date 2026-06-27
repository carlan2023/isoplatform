// ---------------------------------------------------------------------------
// Admin: update an enrollment's status.
//
// Privileged action. Authorization is enforced HERE, server-side:
//   1. Identify the caller from their session cookie (anon client).
//   2. Confirm their profile role is "admin".
//   3. Only then perform the write with the service-role client.
//
// The admin UI calls this route instead of writing through the browser client,
// so status changes can never be triggered by a non-admin even if RLS is
// misconfigured.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const ALLOWED_STATUSES = ["pending", "confirmed", "cancelled"] as const;
type EnrollmentStatus = (typeof ALLOWED_STATUSES)[number];

export async function POST(req: NextRequest) {
  let body: { enrollmentId?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { enrollmentId, status } = body;

  if (
    !enrollmentId ||
    !status ||
    !ALLOWED_STATUSES.includes(status as EnrollmentStatus)
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // 1 + 2: authenticate and authorize the caller.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3: perform the privileged write.
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("enrollments")
    .update({ status })
    .eq("id", enrollmentId);

  if (error) {
    console.error("[admin/enrollments] update failed:", error);
    return NextResponse.json(
      { error: "Could not update enrollment" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
