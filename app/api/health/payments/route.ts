// ---------------------------------------------------------------------------
// GET /api/health/payments — lightweight BroRacks auth probe.
//
// Asks BroRacks for a session token and reports whether that succeeded.
// It never starts a collection, verifies a phone, or moves money. The body
// is only { ok } — error codes and messages stay in the server logs.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { checkBroRacksAuth } from "@/lib/broracks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await checkBroRacksAuth();
    if (!auth.ok) {
      console.error(
        `[payments health] Broracks auth failed: status=${auth.status ?? "none"} code=${auth.code ?? "none"} message=${auth.error ?? "none"}`,
      );
    }
    return NextResponse.json(
      { ok: auth.ok },
      {
        status: auth.ok ? 200 : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (e) {
    console.error(
      "[payments health] check failed:",
      e instanceof Error ? e.message : "unknown",
    );
    return NextResponse.json(
      { ok: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
