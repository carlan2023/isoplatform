// ---------------------------------------------------------------------------
// GET /api/admin/certificates/qr?certificateId=...&format=png|svg
//
// Downloads a QR code that opens /verify/[certificateId] on this site.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrLocalDemo } from "@/lib/admin-auth";
import { isCertificateId, normalizeCertificateId } from "@/lib/certificates";
import {
  certificateQrPng,
  certificateQrSvg,
  certificateVerifyUrl,
  requestPublicOrigin,
} from "@/lib/certificate-qr";
import { certificateAdminError, getCertificateStore } from "@/lib/certificate-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdminOrLocalDemo();
  if ("response" in auth) return auth.response;

  const certificateId = normalizeCertificateId(
    req.nextUrl.searchParams.get("certificateId") ?? "",
  );
  const format = req.nextUrl.searchParams.get("format");
  if (!isCertificateId(certificateId) || (format !== "png" && format !== "svg")) {
    return NextResponse.json({ error: "Unknown certificate." }, { status: 404 });
  }

  try {
    const row = await getCertificateStore().getByCertificateId(certificateId);
    if (!row) {
      return NextResponse.json({ error: "Unknown certificate." }, { status: 404 });
    }
    const url = certificateVerifyUrl(requestPublicOrigin(req), row.certificateId);
    const filename = `${row.certificateId.replaceAll("/", "-")}.${format}`;
    if (format === "svg") {
      const svg = await certificateQrSvg(url);
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }
    const png = await certificateQrPng(url);
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return certificateAdminError(error, "prepare the QR code");
  }
}
