// ---------------------------------------------------------------------------
// QR codes for a printed NAM QMS certificate of completion.
// The code opens /verify/[certificateId] and carries no personal data.
// ---------------------------------------------------------------------------

import QRCode from "qrcode";

const HOST_RE = /^[a-z0-9.-]+(?::\d+)?$/i;

export function certificateVerifyUrl(origin: string, certificateId: string): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}/verify/${encodeURIComponent(certificateId)}`;
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
