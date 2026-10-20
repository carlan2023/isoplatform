// ---------------------------------------------------------------------------
// POST /api/admin/certificates/import — bulk CSV import.
// The whole file is checked first. Nothing is written when a row is invalid.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { requireAdminOrLocalDemo } from "@/lib/admin-auth";
import { parseCertificateCsv } from "@/lib/certificates";
import { certificateAdminError, getCertificateStore } from "@/lib/certificate-store";
import { readJsonObject } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdminOrLocalDemo();
  if ("response" in auth) return auth.response;
  const body = await readJsonObject(req);
  const csv = body?.csv;
  if (typeof csv !== "string") {
    return NextResponse.json({ error: "Paste or upload a CSV file." }, { status: 400 });
  }
  const parsed = parseCertificateCsv(csv);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "Fix the rows below and import again.", errors: parsed.errors },
      { status: 400 },
    );
  }
  try {
    const result = await getCertificateStore().upsertMany(parsed.rows);
    return NextResponse.json(result);
  } catch (error) {
    return certificateAdminError(error, "import certificates");
  }
}
