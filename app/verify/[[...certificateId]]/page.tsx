import type { Metadata } from "next";
import { headers } from "next/headers";
import VerifyShell from "@/app/verify/shell";
import VerifyForm from "@/app/verify/verify-form";
import CertificateLookupResult from "@/app/verify/result";
import { runPublicLookup } from "@/lib/certificate-store";
import {
  VERIFY_PAGE_DESCRIPTION,
  VERIFY_PAGE_TITLE,
  certificateIdFromPath,
  clientIpFromHeaders,
  classifyCertificateId,
  normalizeCertificateId,
} from "@/lib/certificates";
import { SITE_NAME, abs } from "@/lib/site";
import { ogImageMetadata } from "@/lib/media";

export const dynamic = "force-dynamic";

type VerifyQuery = {
  id?: string | string[];
  certificateId?: string | string[];
  surname?: string | string[];
};

function firstQuery(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function requestedCertificateId(
  parts: string[] | undefined,
  query: VerifyQuery,
): string {
  const fromPath = certificateIdFromPath(parts);
  if (fromPath) return fromPath;
  return firstQuery(query.id) || firstQuery(query.certificateId);
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ certificateId?: string[] }>;
  searchParams: Promise<VerifyQuery>;
}): Promise<Metadata> {
  const { certificateId } = await params;
  const query = await searchParams;
  const hasLookup = requestedCertificateId(certificateId, query).length > 0;
  return {
    title: VERIFY_PAGE_TITLE,
    description: VERIFY_PAGE_DESCRIPTION,
    alternates: { canonical: "/verify" },
    robots: hasLookup ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `${VERIFY_PAGE_TITLE} | ${SITE_NAME}`,
      description: VERIFY_PAGE_DESCRIPTION,
      url: abs("/verify"),
      siteName: SITE_NAME,
      type: "website",
      images: [ogImageMetadata],
    },
  };
}

export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ certificateId?: string[] }>;
  searchParams: Promise<VerifyQuery>;
}) {
  const { certificateId } = await params;
  const query = await searchParams;
  const rawId = requestedCertificateId(certificateId, query);
  const rawSurname = firstQuery(query.surname);
  const surname = rawSurname.slice(0, 120);
  const normalized = rawId ? normalizeCertificateId(rawId) : "";
  const initialId =
    rawId && classifyCertificateId(rawId) !== "malformed"
      ? normalized
      : rawId.trim().slice(0, 32);

  if (!rawId) {
    return (
      <VerifyShell>
        <VerifyForm initialSurname={surname} />
      </VerifyShell>
    );
  }

  const headerList = await headers();
  const outcome = await runPublicLookup({
    certificateId: rawId,
    surname,
    ip: clientIpFromHeaders(headerList),
  });

  return (
    <VerifyShell>
      <VerifyForm initialId={initialId} initialSurname={surname} />
      <CertificateLookupResult outcome={outcome} />
    </VerifyShell>
  );
}
