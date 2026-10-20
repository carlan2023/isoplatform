import type { Metadata } from "next";
import VerifyShell from "@/app/verify/shell";
import VerifyForm from "@/app/verify/verify-form";
import { VERIFY_PAGE_DESCRIPTION, VERIFY_PAGE_TITLE } from "@/lib/certificates";
import { SITE_NAME, abs } from "@/lib/site";
import { ogImageMetadata } from "@/lib/media";

export const metadata: Metadata = {
  title: VERIFY_PAGE_TITLE,
  description: VERIFY_PAGE_DESCRIPTION,
  alternates: { canonical: "/verify" },
  openGraph: {
    title: `${VERIFY_PAGE_TITLE} | ${SITE_NAME}`,
    description: VERIFY_PAGE_DESCRIPTION,
    url: abs("/verify"),
    siteName: SITE_NAME,
    type: "website",
    images: [ogImageMetadata],
  },
};

export default function VerifyPage() {
  return (
    <VerifyShell>
      <VerifyForm />
    </VerifyShell>
  );
}
