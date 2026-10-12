// ---------------------------------------------------------------------------
// GET /api/internal-auditor-courses/status?id=<uuid>
//
// Public status poll for the company that just paid. The id is an unguessable
// uuid returned by the enroll request. The response is only status, amount
// and company name — not participant emails or the Mobile Money number.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isUuid } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid enrollment." }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("group_enrollments")
      .select("status, amount, company_name")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[group-enroll] status lookup failed:", error);
      return NextResponse.json(
        { error: "Could not load this enrollment." },
        { status: 500 },
      );
    }
    if (!data) {
      return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        status: data.status,
        amount: data.amount,
        companyName: data.company_name,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("[group-enroll] status:", e);
    return NextResponse.json(
      { error: "Could not load this enrollment." },
      { status: 500 },
    );
  }
}
