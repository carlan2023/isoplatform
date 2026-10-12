// ---------------------------------------------------------------------------
// POST /api/internal-auditor-courses — book Internal Auditor Courses for a
// company team and collect the full total with BroRacks Mobile Money.
//
// The client sends the headcount, each participant, and the total it displayed.
// The price is recomputed here with computePricing(..., "internal-auditor").
// The charge is that full total, and only if it is a whole number of UGX
// between 500 and 7,000,000.
//
// Persistence requires db/group-enrollments.sql to have been run in Supabase.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import {
  BroRacksRejectedError,
  BroRacksTimeoutError,
  initiateCollection,
} from "@/lib/broracks";
import {
  escapeHtml,
  getResendFrom,
  sendResendEmail,
} from "@/lib/email";
import {
  INTERNAL_AUDITOR_COURSE_TITLE,
  INTERNAL_AUDITOR_PRODUCT,
  isGroupHoneypotTripped,
  validateGroupEnrollment,
} from "@/lib/group-enrollment";
import { formatUGX } from "@/lib/pricing";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { CONTACT } from "@/lib/site";

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function rateLimited(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

function isMissingGroupTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = `${error.code ?? ""} ${error.message ?? ""}`;
  return /PGRST205|42P01|schema cache|does not exist|Could not find the table/i.test(msg);
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    if (isGroupHoneypotTripped(body)) {
      return NextResponse.json({ success: true });
    }

    const result = validateGroupEnrollment(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (rateLimited(clientIp(req))) {
      return NextResponse.json(
        {
          error:
            "Too many enrollment attempts from your connection. Please wait a few minutes or contact us on WhatsApp.",
        },
        { status: 429, headers: { "Retry-After": String(RATE_WINDOW_MS / 1000) } },
      );
    }

    const data = result.data;
    const admin = getSupabaseAdmin();

    const { data: created, error: createError } = await admin
      .from("group_enrollments")
      .insert({
        product: INTERNAL_AUDITOR_PRODUCT,
        company_name: data.companyName,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        momo_phone: data.momoPhone,
        participant_count: data.participantCount,
        per_person: data.perPerson,
        amount: data.fullAmount,
        status: "pending",
      })
      .select("id")
      .single();

    if (createError || !created?.id) {
      console.error("[group-enroll] insert failed:", createError);
      if (isMissingGroupTable(createError)) {
        return NextResponse.json(
          {
            error:
              "Group enrollment is not available yet. Please contact us on WhatsApp and we will book your team.",
          },
          { status: 503 },
        );
      }
      return NextResponse.json(
        { error: "Could not save this enrollment. Please try again." },
        { status: 500 },
      );
    }

    const enrollmentId = created.id as string;

    const { error: peopleError } = await admin.from("group_enrollment_participants").insert(
      data.participants.map((person) => ({
        group_enrollment_id: enrollmentId,
        full_name: person.name,
        email: person.email,
      })),
    );

    if (peopleError) {
      console.error("[group-enroll] participants insert failed:", peopleError);
      await admin.from("group_enrollments").delete().eq("id", enrollmentId);
      return NextResponse.json(
        { error: "Could not save the participant list. Please try again." },
        { status: 500 },
      );
    }

    const description =
      `${INTERNAL_AUDITOR_COURSE_TITLE} · ${data.companyName} · ${data.participantCount} participants`.slice(
        0,
        140,
      );

    let reference = "";
    try {
      const collection = await initiateCollection({
        payerName: data.contactName,
        phoneNumber: data.momoPhone,
        amount: data.fullAmount,
        description,
        idempotencyKey: enrollmentId,
      });
      reference = collection.reference;
    } catch (e) {
      await admin
        .from("group_enrollments")
        .update({ status: "cancelled" })
        .eq("id", enrollmentId)
        .eq("status", "pending");

      const timedOut = e instanceof BroRacksTimeoutError;
      const providerReason =
        e instanceof BroRacksRejectedError &&
        e.providerMessage &&
        e.status !== 401 &&
        e.status !== 403 &&
        (e.status ?? 0) < 500
          ? e.providerMessage
          : null;
      console.error("[group-enroll] collection initiate failed:", e);
      return NextResponse.json(
        {
          error: timedOut
            ? "Mobile Money is taking too long to respond. If a payment prompt still reaches your phone, please decline it — then try again."
            : providerReason
              ? `Mobile Money couldn't start the payment: ${providerReason}. Check the number and try again.`
              : "We couldn't start the Mobile Money payment. Check the number and try again.",
        },
        { status: timedOut ? 504 : 502 },
      );
    }

    const { data: linked, error: linkError } = await admin
      .from("group_enrollments")
      .update({
        payment_reference: reference,
        status: "awaiting_confirmation",
      })
      .eq("id", enrollmentId)
      .eq("status", "pending")
      .select("id");

    if (linkError || !linked || linked.length === 0) {
      console.error(
        `[group-enroll] could not store payment reference ${reference} for ${enrollmentId}:`,
        linkError,
      );
      return NextResponse.json(
        {
          error:
            "Your payment prompt was sent, but we couldn't link it to this enrollment. Please contact us on WhatsApp with this reference before approving.",
          reference,
          id: enrollmentId,
        },
        { status: 500 },
      );
    }

    const amountLabel = formatUGX(data.fullAmount);
    const mail = await sendResendEmail({
      from: getResendFrom(),
      to: data.contactEmail,
      subject: `Approve your Mobile Money payment — ${INTERNAL_AUDITOR_COURSE_TITLE}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b;">
          <div style="border-left: 4px solid #0d9488; padding-left: 20px; margin-bottom: 32px;">
            <h1 style="margin: 0; font-size: 22px;">Approve payment on your phone</h1>
            <p style="margin: 8px 0 0; color: #64748b; font-family: system-ui, sans-serif;">NAM QMS</p>
          </div>
          <p style="font-family: system-ui, sans-serif; color: #475569;">Dear ${escapeHtml(data.contactName)},</p>
          <p style="font-family: system-ui, sans-serif; color: #475569;">
            ${escapeHtml(data.companyName)} started a Mobile Money payment of
            <strong>${escapeHtml(amountLabel)}</strong> for
            <strong>${escapeHtml(INTERNAL_AUDITOR_COURSE_TITLE)}</strong>
            (${data.participantCount} ${data.participantCount === 1 ? "participant" : "participants"}).
            Please approve the prompt on ${escapeHtml(data.momoPhone)}.
            Your payment reference is <strong>${escapeHtml(reference)}</strong>.
          </p>
          <p style="font-family: system-ui, sans-serif; color: #475569;">
            Once the payment is confirmed, we'll email you. Questions:
            <a href="${CONTACT.whatsapp}" style="color: #0d9488;">${escapeHtml(CONTACT.phoneDisplay)}</a>.
          </p>
        </div>
      `,
    });
    if (!mail.ok) {
      console.error("[group-enroll] initiation email failed:", mail.error);
    }

    return NextResponse.json({
      success: true,
      id: enrollmentId,
      reference,
      amount: data.fullAmount,
      team: data.participantCount,
      phone: data.momoPhone,
    });
  } catch (e) {
    console.error("[group-enroll]", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
