// ---------------------------------------------------------------------------
// POST /api/admin/certificates/next
//
// Assigns the next serial for a year and course code (LA or IA).
// Serial 000 stays reserved for the sample certificates.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { requireAdminOrLocalDemo } from "@/lib/admin-auth";
import { assignNextCertificateId, type CourseCode } from "@/lib/certificates";
import {
  certificateAdminError,
  ensureDemoCertificates,
  getCertificateStore,
} from "@/lib/certificate-store";
import { readJsonObject } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdminOrLocalDemo();
  if ("response" in auth) return auth.response;
  const body = await readJsonObject(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const year = typeof body.year === "number" ? body.year : Number(body.year);
  const courseCode = body.courseCode;
  if (courseCode !== "LA" && courseCode !== "IA") {
    return NextResponse.json({ error: "Choose LA or IA." }, { status: 400 });
  }
  try {
    const store = getCertificateStore();
    await ensureDemoCertificates(store);
    const certificateId = await assignNextCertificateId(
      store,
      year,
      courseCode as CourseCode,
    );
    return NextResponse.json({ certificateId });
  } catch (error) {
    return certificateAdminError(error, "assign a certificate number");
  }
}
