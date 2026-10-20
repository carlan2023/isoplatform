// ---------------------------------------------------------------------------
// GET /api/verify?certificateId=NAMQMS-2026-LA-0001&surname=Holder
//
// The only public read of a NAM QMS certificate of completion. Returns the
// holder name, course, training dates, issue date and status. A miss and a
// failed surname check look the same. There is no list endpoint.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { clientIpFromHeaders, type PublicLookupOutcome } from "@/lib/certificates";
import { runPublicLookup } from "@/lib/certificate-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
};

export function lookupResponse(outcome: PublicLookupOutcome) {
  switch (outcome.kind) {
    case "invalid_id":
      return NextResponse.json(
        { error: "Enter a certificate ID such as NAMQMS-2026-LA-0001." },
        { status: 400, headers: NO_STORE },
      );
    case "rate_limited":
      return NextResponse.json(
        { error: "Too many lookups. Please wait and try again." },
        { status: 429, headers: NO_STORE },
      );
    case "unavailable":
      return NextResponse.json(
        { error: "Certificate verification is temporarily unavailable." },
        { status: 503, headers: NO_STORE },
      );
    case "not_found":
      return NextResponse.json({ found: false }, { status: 404, headers: NO_STORE });
    case "found":
      return NextResponse.json(
        { found: true, certificate: outcome.certificate },
        { status: 200, headers: NO_STORE },
      );
  }
}

export async function GET(req: NextRequest) {
  const outcome = await runPublicLookup({
    certificateId: req.nextUrl.searchParams.get("certificateId") ?? "",
    surname: req.nextUrl.searchParams.get("surname"),
    ip: clientIpFromHeaders(req.headers),
  });
  return lookupResponse(outcome);
}
