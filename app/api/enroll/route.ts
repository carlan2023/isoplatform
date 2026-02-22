import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { courseId, name, company, email, phone } = await req.json();

  // Fetch course details
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (!course)
    return NextResponse.json({ error: "Course not found" }, { status: 404 });

  // Save enrollment request to Supabase
  await supabase.from("enrollments").insert({
    user_id: "00000000-0000-0000-0000-000000000000", // placeholder until auth is linked
    course_id: courseId,
    status: "pending",
    amount_paid: course.price_usd,
  });

  // Send notification email to YOU
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: process.env.NOTIFICATION_EMAIL!,
    subject: `New Enrollment Request — ${course.title}`,
    html: `
      <h2>New Enrollment Request</h2>
      <p><strong>Course:</strong> ${course.title}</p>
      <p><strong>Start Date:</strong> ${course.start_date}</p>
      <p><strong>Price:</strong> $${course.price_usd}</p>
      <hr/>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <hr/>
      <p>Log in to your dashboard to confirm this enrollment and send an invoice.</p>
    `,
  });

  // Send confirmation email to CLIENT
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: `Enrollment Request Received — ${course.title}`,
    html: `
      <h2>Thank you, ${name}!</h2>
      <p>We have received your enrollment request for <strong>${course.title}</strong>.</p>
      <p>Our team will contact you within 24 hours with payment details and next steps.</p>
      <br/>
      <p><strong>Course:</strong> ${course.title}</p>
      <p><strong>Start Date:</strong> ${course.start_date}</p>
      <p><strong>Investment:</strong> $${course.price_usd}</p>
      <br/>
      <p>Best regards,<br/>Your ISO Consulting Team</p>
    `,
  });

  return NextResponse.json({ success: true });
}
