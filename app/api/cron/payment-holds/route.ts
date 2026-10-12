// ---------------------------------------------------------------------------
// GET /api/cron/payment-holds
//
// Backstop for learners who leave the payment screen. Polls BroRacks for held
// Mobile Money payments and releases seats that failed, were cancelled, or
// are still pending after 15 minutes. Protected by CRON_SECRET (Vercel Cron
// sends Authorization: Bearer <CRON_SECRET>). Does not start a charge.
// ---------------------------------------------------------------------------

import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { reconcileOpenHolds } from "@/lib/payment-reconcile";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) {
    console.error("[payments cron] CRON_SECRET is not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await reconcileOpenHolds(getSupabaseAdmin());
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(
      "[payments cron]",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json({ error: "Could not reconcile payments" }, { status: 500 });
  }
}
