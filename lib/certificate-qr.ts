// ---------------------------------------------------------------------------
// QR codes for a printed NAM QMS certificate of completion.
// Production codes open https://amqualitysystems.com/verify?id=NQ26LA014E.
// Preview and local hosts keep their own origin so the code opens that site.
// The code carries no personal data.
// ---------------------------------------------------------------------------

import QRCode from "qrcode";
import { APEX_HOST, CANONICAL_HOST } from "./site";

const HOST_RE = /^[a-z0-9.-]+(?::\d+)?$/i;

export const CERTIFICATE_QR_ORIGIN = `https://${APEX_HOST}`;

export function qrOrigin(origin: string): string {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    if (host === APEX_HOST || host === CANONICAL_HOST) return CERTIFICATE_QR_ORIGIN;
  } catch {
    // Keep a non-URL origin only after the trailing slash is removed below.
  }
  return origin.replace(/\/+$/, "");
}

export function certificateVerifyUrl(origin: string, certificateId: string): string {
  return `${qrOrigin(origin)}/verify?id=${encodeURIComponent(certificateId)}`;
}

export function requestPublicOrigin(request: {
  url: string;
  headers: { get(name: string): string | null };
}): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? "";
  const host = forwardedHost || request.headers.get("host")?.trim() || "";
  const protoHeader = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (host && HOST_RE.test(host)) {
    const proto = protoHeader === "http" ? "http" : "https";
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

export async function certificateQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
  });
}

export async function certificateQrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: "png",
    margin: 1,
    width: 512,
    errorCorrectionLevel: "M",
  });
}
