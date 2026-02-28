import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseServer } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { courseId, name, company, email, phone } = await req.json();

  // Fetch course details
  const { data: course } = await supabaseServer
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (!course)
    return NextResponse.json({ error: "Course not found" }, { status: 404 });

  // Assign seat number based on current enrollment count
  const { count } = await supabaseServer
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .eq("course_id", courseId);

  const seatNumber = (count || 0) + 1;

  // Save enrollment to Supabase
  await supabaseServer.from("enrollments").insert({
    user_id: "00000000-0000-0000-0000-000000000000",
    course_id: courseId,
    status: "pending",
    amount_paid: course.price_usd,
  });

  // Increment seats_taken on the course
  await supabaseServer
    .from("courses")
    .update({ seats_taken: seatNumber })
    .eq("id", courseId);

  const startDate = new Date(course.start_date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Email to YOU
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: process.env.NOTIFICATION_EMAIL!,
    subject: `New Enrollment — ${course.title} · Seat ${seatNumber}`,
    html: `
      <h2>New Enrollment Request</h2>
      <p><strong>Course:</strong> ${course.title}</p>
      <p><strong>Start Date:</strong> ${startDate}</p>
      <p><strong>Seat Number:</strong> ${seatNumber}</p>
      <p><strong>Price:</strong> UGX ${Number(
        course.price_usd
      ).toLocaleString()}</p>
      <hr/>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
    `,
  });

  // Email to CLIENT
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: `Enrollment Confirmed — ${course.title}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
        <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
          <h1 style="margin: 0; font-size: 24px;">Enrollment Request Received</h1>
          <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">AM Quality Management Systems · ISO Lead Auditor Training</p>
        </div>

        <p style="font-family: system-ui, sans-serif; color: #475569;">Dear ${name},</p>
        <p style="font-family: system-ui, sans-serif; color: #475569;">
          Thank you for your enrollment request. Your seat has been reserved and our team will contact you within 24 hours with your invoice and payment instructions.
        </p>

        <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 24px; margin: 24px 0;">
          <h2 style="margin: 0 0 16px; font-size: 16px; color: #0f766e;">Your Enrollment Details</h2>
          <table style="width: 100%; font-family: system-ui, sans-serif; font-size: 14px; color: #475569;">
            <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Course</td><td>${
              course.title
            }</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Standard</td><td>${
              course.standard
            }</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Start Date</td><td>${startDate}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Duration</td><td>${
              course.duration_days
            } days · ${course.format}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Seat Number</td><td style="color: #0d9488; font-weight: 700;">#${seatNumber}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Amount Due</td><td>UGX ${Number(
              course.price_usd
            ).toLocaleString()}</td></tr>
          </table>
        </div>

        <p style="font-family: system-ui, sans-serif; color: #475569;">
          Please keep this email for your records. Your seat number <strong>#${seatNumber}</strong> will be used for all correspondence regarding this enrollment.
        </p>

        <p style="font-family: system-ui, sans-serif; color: #475569;">
          Best regards,<br/>
          <strong>AM QMS</strong><br/>
          ISO Lead Auditor Training
        </p>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
