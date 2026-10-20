// ---------------------------------------------------------------------------
// POST /api/admin/certificates/service
//
// Server-only certificate admin for an assistant. There is no browser session.
// Authorization: Bearer <CERT_ADMIN_TOKEN>. Fail closed when the token is unset.
//
//   { "action": "add", "certificate": { ... } }
//   { "action": "revoke", "certificateId": "NQ26LA014E" }
//   { "action": "revoke", "certificateIds": ["NQ26LA014E"] }
//   { "action": "bulk", "certificates": [ { ... } ] }
//   { "action": "bulk", "csv": "certificate_id,..." }
//
// Does not insert sample certificates.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import {
  applyCertAdminCommand,
  isCertAdminAuthorized,
  parseCertAdminBody,
} from "@/lib/cert-admin";
import { certificateAdminError, getCertificateStore } from "@/lib/certificate-store";
import { readJsonObject } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(req: Request) {
  if (!isCertAdminAuthorized(req.headers.get("authorization"), process.env.CERT_ADMIN_TOKEN)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers: NO_STORE });
  }
  const body = await readJsonObject(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: NO_STORE });
  }
  const parsed = parseCertAdminBody(body);
  if (!parsed.ok) {
    return NextResponse.json(
      parsed.errors ? { error: parsed.error, errors: parsed.errors } : { error: parsed.error },
      { status: 400, headers: NO_STORE },
    );
  }
  try {
    const result = await applyCertAdminCommand(getCertificateStore(), parsed.command);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status, headers: NO_STORE });
    }
    return NextResponse.json(result, {
      status: result.action === "add" ? 201 : 200,
      headers: NO_STORE,
    });
  } catch (error) {
    return certificateAdminError(error, "update certificates");
  }
}
