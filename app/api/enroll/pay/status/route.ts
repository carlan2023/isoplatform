// ---------------------------------------------------------------------------
// GET /api/enroll/pay/status?enrollmentId=
//
// While a learner is waiting on the Mobile Money prompt, the page polls this.
// It asks BroRacks for the collection status (no new charge) and, when the
// prompt was cancelled, failed, expired, or is still pending after 15 minutes,
// releases the seat. Cash/offline holds are left alone.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isUuid } from "@/lib/validation";
import { reconcileEnrollmentById } from "@/lib/payment-reconcile";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const enrollmentId = req.nextUrl.searchParams.get("enrollmentId") ?? "";
    if (!isUuid(enrollmentId)) {
      return NextResponse.json(
        { error: "Missing or invalid enrollment reference." },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: enrollment, error } = await admin
      .from("enrollments")
      .select("id, user_id, status")
      .eq("id", enrollmentId)
      .maybeSingle();

    if (error) {
      console.error("[enroll:pay:status] lookup failed:", error);
      return NextResponse.json(
        { error: "Could not load your booking. Please try again." },
        { status: 500 },
      );
    }
    if (!enrollment || enrollment.user_id !== user.id) {
      return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
    }

    if (enrollment.status !== "awaiting_confirmation") {
      return NextResponse.json(
        { status: enrollment.status },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const result = await reconcileEnrollmentById(admin, enrollmentId);
    return NextResponse.json(
      { status: result?.status ?? enrollment.status },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[enroll:pay:status]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Could not check the payment. Please try again." },
      { status: 500 },
    );
  }
}
