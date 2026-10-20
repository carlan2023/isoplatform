import type { Metadata } from "next";
import { headers } from "next/headers";
import VerifyShell from "@/app/verify/shell";
import VerifyForm from "@/app/verify/verify-form";
import CertificateLookupResult from "@/app/verify/result";
import { runPublicLookup } from "@/lib/certificate-store";
import {
  VERIFY_PAGE_DESCRIPTION,
  VERIFY_PAGE_TITLE,
  clientIpFromHeaders,
  isCertificateId,
  normalizeCertificateId,
} from "@/lib/certificates";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: VERIFY_PAGE_TITLE,
    description: VERIFY_PAGE_DESCRIPTION,
    alternates: { canonical: "/verify" },
    robots: { index: false, follow: true },
  };
}

export default async function VerifyCertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ certificateId: string }>;
  searchParams: Promise<{ surname?: string | string[] }>;
}) {
  const { certificateId } = await params;
  const query = await searchParams;
  const rawSurname = Array.isArray(query.surname) ? query.surname[0] : query.surname;
  const surname = (rawSurname ?? "").slice(0, 120);
  const headerList = await headers();
  const outcome = await runPublicLookup({
    certificateId,
    surname,
    ip: clientIpFromHeaders(headerList),
  });
  const normalized = normalizeCertificateId(certificateId);
  const initialId = isCertificateId(normalized) ? normalized : certificateId.slice(0, 40);

  return (
    <VerifyShell>
      <VerifyForm initialId={initialId} initialSurname={surname} />
      <CertificateLookupResult outcome={outcome} />
    </VerifyShell>
  );
}
