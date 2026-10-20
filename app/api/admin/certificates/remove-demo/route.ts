// ---------------------------------------------------------------------------
// POST /api/admin/certificates/remove-demo
// Deletes only the two clearly fake preview rows.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { requireAdminOrLocalDemo } from "@/lib/admin-auth";
import { removeDemoCertificates } from "@/lib/certificates";
import { certificateAdminError, getCertificateStore } from "@/lib/certificate-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireAdminOrLocalDemo();
  if ("response" in auth) return auth.response;
  try {
    const deleted = await removeDemoCertificates(await getCertificateStore());
    return NextResponse.json({ deleted });
  } catch (error) {
    return certificateAdminError(error, "remove the sample certificates");
  }
}
