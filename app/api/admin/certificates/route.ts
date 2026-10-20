// ---------------------------------------------------------------------------
// Admin certificates of completion.
//
//   GET   — list rows for the admin screen
//   POST  — add one certificate
//   PATCH — edit or revoke one certificate
//
// Authorization is enforced here, then the service role reads and writes.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { requireAdminOrLocalDemo } from "@/lib/admin-auth";
import {
  certificateInputFromBody,
  readOriginalCertificateId,
} from "@/lib/certificates";
import {
  certificateAdminError,
  ensureDemoCertificates,
  getCertificateStore,
} from "@/lib/certificate-store";
import { readJsonObject } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminOrLocalDemo();
  if ("response" in auth) return auth.response;
  try {
    const store = getCertificateStore();
    await ensureDemoCertificates(store);
    const certificates = await store.list();
    return NextResponse.json({ certificates });
  } catch (error) {
    return certificateAdminError(error, "load certificates");
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminOrLocalDemo();
  if ("response" in auth) return auth.response;
  const body = await readJsonObject(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = certificateInputFromBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    const certificate = await getCertificateStore().insert(parsed.value);
    return NextResponse.json({ certificate }, { status: 201 });
  } catch (error) {
    return certificateAdminError(error, "add the certificate");
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdminOrLocalDemo();
  if ("response" in auth) return auth.response;
  const body = await readJsonObject(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const originalId = readOriginalCertificateId(body);
  if (!originalId) {
    return NextResponse.json(
      { error: "Choose the certificate to update." },
      { status: 400 },
    );
  }
  const parsed = certificateInputFromBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    const certificate = await getCertificateStore().update(originalId, parsed.value);
    if (!certificate) {
      return NextResponse.json(
        { error: "That certificate was not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ certificate });
  } catch (error) {
    return certificateAdminError(error, "update the certificate");
  }
}
