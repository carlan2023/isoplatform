import { randomBytes, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { initiateCollection } from "@/lib/broracks";
import {
  escapeHtml,
  getResendFrom,
  getResendNotificationsFrom,
  sendResendEmail,
} from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { computePricing, isValidPayAmount } from "@/lib/pricing";

async function findUserIdByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      console.error("[enroll] listUsers:", error);
      return null;
    }
    const found = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (found) return found.id;
    if (data.users.length < perPage) break;
    page += 1;
    if (page > 40) break;
  }
  return null;
}

async function upsertEnrollmentProfile(
  admin: SupabaseClient,
  userId: string,
  params: { name: string; company: string; phone: string },
) {
  const row = {
    id: userId,
    name: params.name,
    full_name: params.name,
    company: params.company,
    phone: params.phone,
  };

  let { error } = await admin.from("profiles").upsert(row, { onConflict: "id" });

  if (
    error &&
    typeof error.message === "string" &&
    /full_name|schema cache|column/i.test(error.message)
  ) {
    ({ error } = await admin.from("profiles").upsert(
      {
        id: userId,
        name: params.name,
        company: params.company,
        phone: params.phone,
      },
      { onConflict: "id" },
    ));
  }

  if (error) {
    console.error("[enroll] profiles upsert:", error);
    throw new Error(
      `Could not save profile: ${error.message}. Check profiles columns and that SUPABASE_SERVICE_ROLE_KEY is set.`,
    );
  }
}

async function getOrCreateAuthUserId(
  admin: SupabaseClient,
  params: {
    email: string;
    name: string;
    company: string;
    phone: string;
  },
): Promise<string> {
  const password = randomBytes(24).toString("base64url");
  const { data, error } = await admin.auth.admin.createUser({
    email: params.email.trim(),
    email_confirm: true,
    password,
    user_metadata: {
      name: params.name,
      full_name: params.name,
      company: params.company,
      phone: params.phone,
    },
  });

  if (data?.user?.id) {
    await upsertEnrollmentProfile(admin, data.user.id, {
      name: params.name,
      company: params.company,
      phone: params.phone,
    });
    return data.user.id;
  }

  // Supabase often returns opaque messages for "email already in use". Always try
  // resolving an existing auth user before failing the enrollment.
  const existingId = await findUserIdByEmail(admin, params.email);
  if (existingId) {
    await upsertEnrollmentProfile(admin, existingId, {
      name: params.name,
      company: params.company,
      phone: params.phone,
    });
    return existingId;
  }

  console.error("[enroll] createUser failed and email not found in auth:", error);
  throw new Error(
    error?.message ||
      "Could not create an account for this email. Confirm SUPABASE_SERVICE_ROLE_KEY is set on the server and Auth sign-ups are allowed.",
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      courseId,
      name,
      company,
      email,
      phone,
      teamSize: rawTeamSize,
      amount: rawAmount,
      fullAmount: rawFullAmount,
    } = body as {
      courseId?: string;
      name?: string;
      company?: string;
      email?: string;
      phone?: string;
      teamSize?: number;
      amount?: number;
      fullAmount?: number;
    };

    if (!courseId || !name || !email || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (
      typeof rawAmount !== "number" ||
      !Number.isFinite(rawAmount) ||
      typeof rawFullAmount !== "number" ||
      !Number.isFinite(rawFullAmount)
    ) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 },
      );
    }

    const amount = Math.round(rawAmount);
    const { team, fullAmount, minDeposit } = computePricing(
      Number(rawTeamSize) || 1,
    );

    if (fullAmount !== Math.round(rawFullAmount)) {
      return NextResponse.json(
        { error: "Price total does not match course pricing" },
        { status: 400 },
      );
    }

    if (amount < 1 || !isValidPayAmount(amount, fullAmount, minDeposit)) {
      return NextResponse.json(
        { error: "Payment amount is not allowed for this booking" },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();

    const { data: course, error: courseError } = await admin
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const userId = await getOrCreateAuthUserId(admin, {
      email,
      name,
      company: company ?? "",
      phone,
    });

    // Atomically reserve a seat: one row-locked DB function does the capacity
    // check AND the insert, so concurrent requests can't oversell the course or
    // collide on a seat number. It also keeps courses.seats_taken in sync.
    const { data: reservation, error: reserveError } = await admin.rpc(
      "reserve_enrollment_seat",
      { p_course_id: courseId, p_user_id: userId, p_amount: amount },
    );

    if (reserveError) {
      const msg = reserveError.message || "";
      if (msg.includes("COURSE_FULL")) {
        return NextResponse.json(
          { error: "This course is full. Please choose another date." },
          { status: 409 },
        );
      }
      if (msg.includes("COURSE_NOT_FOUND")) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }
      console.error("[enroll] seat reservation failed:", reserveError);
      return NextResponse.json(
        { error: "Could not reserve a seat. Please try again." },
        { status: 500 },
      );
    }

    const reserved = Array.isArray(reservation) ? reservation[0] : reservation;
    const enrollmentId: string | undefined = reserved?.enrollment_id;
    const seatNumber: number = reserved?.seat_number ?? 0;

    if (!enrollmentId) {
      console.error("[enroll] reservation returned no row:", reservation);
      return NextResponse.json(
        { error: "Could not reserve a seat. Please try again." },
        { status: 500 },
      );
    }

    // Seat is held. Initiate Mobile Money; if that fails, release the seat so an
    // un-started payment never holds capacity.
    const idempotencyKey = randomUUID();
    let reference = "";
    try {
      const collection = await initiateCollection({
        payerName: name.trim(),
        phoneNumber: phone.trim(),
        amount,
        description: `${course.standard ?? "Course"} · ${course.title} · seat ${seatNumber}`,
        idempotencyKey,
      });
      reference = collection.reference;
    } catch (e) {
      await admin
        .from("enrollments")
        .update({ status: "cancelled" })
        .eq("id", enrollmentId);
      await admin.rpc("recompute_course_seats", { p_course_id: courseId });
      console.error("[enroll] collection initiate failed; seat released:", e);
      return NextResponse.json(
        { error: "Could not start the Mobile Money payment. Please try again." },
        { status: 502 },
      );
    }

    // Link the payment reference to the reserved enrollment for webhook matching.
    const { error: refError } = await admin
      .from("enrollments")
      .update({ stripe_session_id: reference })
      .eq("id", enrollmentId);

    if (refError) {
      console.error("[enroll] could not store payment reference:", refError);
      return NextResponse.json(
        {
          error:
            "Payment started but could not be linked. Contact support with your payment reference.",
          reference,
        },
        { status: 500 },
      );
    }

    const startDate = new Date(course.start_date).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const safeName = escapeHtml(name.trim());
    const safeCompany = escapeHtml(String(company ?? "").trim());
    const safeEmail = escapeHtml(email.trim());
    const safePhone = escapeHtml(phone.trim());
    const safeCourseTitle = escapeHtml(String(course.title));
    const safeStandard = escapeHtml(String(course.standard ?? ""));

    const staffTo = process.env.NOTIFICATION_EMAIL?.trim();
    if (staffTo) {
      const notify = await sendResendEmail({
        from: getResendNotificationsFrom(),
        to: staffTo,
        subject: `New enrollment + Mobile Money — ${course.title} · ref ${reference}`,
        html: `
      <h2>New enrollment (payment initiated)</h2>
      <p><strong>BroRacks reference:</strong> ${escapeHtml(reference)}</p>
      <p><strong>Course:</strong> ${safeCourseTitle}</p>
      <p><strong>Start date:</strong> ${escapeHtml(startDate)}</p>
      <p><strong>Seat #:</strong> ${seatNumber}</p>
      <p><strong>Team size:</strong> ${team}</p>
      <p><strong>Pay now:</strong> UGX ${amount.toLocaleString()}</p>
      <p><strong>Full quote:</strong> UGX ${fullAmount.toLocaleString()}</p>
      <hr/>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Company:</strong> ${safeCompany}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Phone:</strong> ${safePhone}</p>
    `,
      });
      if (!notify.ok) {
        console.error("[enroll] staff notification email failed:", notify.error);
      }
    } else {
      console.warn(
        "[enroll] NOTIFICATION_EMAIL is not set — skipping staff email",
      );
    }

    const studentMail = await sendResendEmail({
      from: getResendFrom(),
      to: email.trim(),
      subject: `We received your enrollment — ${course.title}`,
      html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
        <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
          <h1 style="margin: 0; font-size: 24px;">Approve payment on your phone</h1>
          <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">AM Quality Management Systems · ISO Lead Auditor Training</p>
        </div>

        <p style="font-family: system-ui, sans-serif; color: #475569;">Dear ${safeName
        },</p>
        <p style="font-family: system-ui, sans-serif; color: #475569;">
          You started a Mobile Money payment of <strong>UGX ${amount.toLocaleString()}</strong>.
          Please approve the prompt on your phone. Your payment reference is <strong>${escapeHtml(reference)}</strong>.
        </p>
        <p style="font-family: system-ui, sans-serif; color: #475569;">
          After payment succeeds, you will receive another email confirming your seat. If you do not see it, check spam or contact us.
        </p>

        <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 24px; margin: 24px 0;">
          <h2 style="margin: 0 0 16px; font-size: 16px; color: #0f766e;">Enrollment details</h2>
          <table style="width: 100%; font-family: system-ui, sans-serif; font-size: 14px; color: #475569;">
            <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Course</td><td>${safeCourseTitle}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Standard</td><td>${safeStandard}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Start date</td><td>${escapeHtml(startDate)}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Duration</td><td>${course.duration_days} days · ${escapeHtml(String(course.format))}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Seat</td><td style="color: #0d9488; font-weight: 700;">#${seatNumber}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Amount due (quote)</td><td>UGX ${fullAmount.toLocaleString()}</td></tr>
          </table>
        </div>

        <p style="font-family: system-ui, sans-serif; color: #475569;">
          Best regards,<br/>
          <strong>AM QMS</strong><br/>
          ISO Lead Auditor Training
        </p>
      </div>
    `,
    });

    if (!studentMail.ok) {
      console.error(
        "[enroll] student email failed (payment still initiated):",
        studentMail.error,
      );
    }

    return NextResponse.json({
      success: true,
      reference,
      emailSent: studentMail.ok,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Enrollment failed";
    console.error("[enroll]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
