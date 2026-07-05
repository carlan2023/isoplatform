// ---------------------------------------------------------------------------
// Admin enrollments API.
//
//   GET  — enriched list of every enrollment (learner name/email, course,
//          amount, reference, status) for the admin dashboard.
//   POST — update an enrollment's status (manual confirm / cancel / override).
//
// Both are privileged. Authorization is enforced HERE, server-side:
//   1. Identify the caller from their session cookie (anon client).
//   2. Confirm their profile role is "admin".
//   3. Only then read/write with the service-role client.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  escapeHtml,
  getResendFrom,
  getResendNotificationsFrom,
  sendResendEmail,
} from "@/lib/email";

const ALLOWED_STATUSES = [
  "pending",
  "awaiting_confirmation",
  "confirmed",
  "cancelled",
] as const;
type EnrollmentStatus = (typeof ALLOWED_STATUSES)[number];

// Confirm the caller is a signed-in admin. Returns the admin's user id or a
// NextResponse to return early.
async function requireAdmin(): Promise<
  { userId: string } | { response: NextResponse }
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { userId: user.id };
}

// Build a userId -> email map by paging through the auth users list.
async function buildEmailMap(
  admin: SupabaseClient,
  wanted: Set<string>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("[admin/enrollments] listUsers:", error);
      break;
    }
    for (const u of data.users) {
      if (u.email && wanted.has(u.id)) map.set(u.id, u.email);
    }
    if (data.users.length < perPage) break;
    page += 1;
    if (page > 50) break;
  }
  return map;
}

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const admin = getSupabaseAdmin();

  const { data: rows, error } = await admin
    .from("enrollments")
    .select(
      "id, status, amount_paid, enrolled_at, stripe_session_id, user_id, courses (id, title, standard, start_date)",
    )
    .order("enrolled_at", { ascending: false });

  if (error) {
    console.error("[admin/enrollments] list failed:", error);
    return NextResponse.json(
      { error: "Could not load enrollments" },
      { status: 500 },
    );
  }

  const list = rows ?? [];
  const userIds = [
    ...new Set(list.map((r) => r.user_id).filter(Boolean) as string[]),
  ];

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, phone, company")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const profMap = new Map(
    (profiles ?? []).map((p) => [p.id as string, p]),
  );
  const emailMap = await buildEmailMap(admin, new Set(userIds));

  const enrollments = list.map((r) => {
    const course = Array.isArray(r.courses) ? r.courses[0] : r.courses;
    const prof = profMap.get(r.user_id as string);
    return {
      id: r.id,
      status: r.status,
      amount_paid: r.amount_paid,
      enrolled_at: r.enrolled_at,
      reference: r.stripe_session_id,
      course: course
        ? {
            id: course.id,
            title: course.title,
            standard: course.standard,
            start_date: course.start_date,
          }
        : null,
      learner: {
        name: prof?.full_name ?? null,
        email: emailMap.get(r.user_id as string) ?? null,
        phone: prof?.phone ?? null,
        company: prof?.company ?? null,
      },
    };
  });

  return NextResponse.json({ enrollments });
}

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

  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const admin = getSupabaseAdmin();

  const { data: updated, error } = await admin
    .from("enrollments")
    .update({ status })
    .eq("id", enrollmentId)
    .select("id, user_id, course_id, amount_paid, courses (title, standard)")
    .maybeSingle();

  if (error || !updated) {
    console.error("[admin/enrollments] update failed:", error);
    return NextResponse.json(
      { error: "Could not update enrollment" },
      { status: 500 },
    );
  }

  // Keep seats_taken in sync — a manual status change can add or release a held
  // seat (held = awaiting_confirmation + confirmed).
  if (updated.course_id) {
    await admin.rpc("recompute_course_seats", {
      p_course_id: updated.course_id,
    });
  }

  // On a manual confirmation, notify the learner and the admin inbox — mirrors
  // the automatic webhook confirmation.
  if (status === "confirmed") {
    const course = Array.isArray(updated.courses)
      ? updated.courses[0]
      : updated.courses;
    const title = escapeHtml(String(course?.title ?? "your course"));

    const { data: userData } = await admin.auth.admin.getUserById(
      updated.user_id as string,
    );
    const learnerEmail = userData?.user?.email?.trim();

    if (learnerEmail) {
      const learnerMail = await sendResendEmail({
        from: getResendFrom(),
        to: learnerEmail,
        subject: `You're enrolled — ${course?.title ?? "AM QMS"}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
            <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
              <h1 style="margin: 0; font-size: 22px;">You're enrolled ✓</h1>
              <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">AM Quality Management Systems</p>
            </div>
            <p style="font-family: system-ui, sans-serif; color: #475569;">
              Your payment has been confirmed and your seat in <strong>${title}</strong> is reserved.
              We'll be in touch with joining instructions.
            </p>
          </div>
        `,
      });
      if (!learnerMail.ok) {
        console.error(
          "[admin/enrollments] learner confirmation email failed:",
          learnerMail.error,
        );
      }
    }

    const staffTo = process.env.NOTIFICATION_EMAIL?.trim();
    if (staffTo) {
      await sendResendEmail({
        from: getResendNotificationsFrom(),
        to: staffTo,
        subject: `Enrollment confirmed (manual) — ${course?.title ?? ""}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; color: #1e293b;">
            <h2 style="margin: 0 0 12px;">Enrollment confirmed manually</h2>
            <p style="color: #475569;">${title} — learner ${escapeHtml(learnerEmail ?? "unknown")}.</p>
          </div>
        `,
      });
    }
  }

  return NextResponse.json({ success: true });
}
