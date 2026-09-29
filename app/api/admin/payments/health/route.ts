// ---------------------------------------------------------------------------
// GET /api/admin/payments/health — admin-only BroRacks connection check.
//
// Reports which env vars are set, the API URL in use, whether a real token
// request succeeds, and the webhook URL to register with BroRacks. Never
// returns keys, secrets or the token. Always runs live (no caching).
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getBroRacksHealth } from "@/lib/broracks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;

    return NextResponse.json(await getBroRacksHealth(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[admin/payments/health] GET failed:", e);
    return NextResponse.json(
      { error: "Could not check payments health" },
      { status: 500 },
    );
  }
}
