import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL, SITE_NAME, abs } from "@/lib/site";
import { OG_IMAGE } from "@/lib/media";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "ISO Certification for Businesses in Uganda & East Africa | AM Quality Management Systems",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "We help businesses across Uganda and East Africa get ISO 9001, 14001, 45001 & 22000 certified — gap analysis, documentation and audit preparation, end to end. Plus internationally recognised ISO Lead Auditor training.",
  keywords: [
    "ISO certification Uganda",
    "ISO certification East Africa",
    "ISO 9001 certification",
    "ISO certification consulting",
    "get ISO certified",
    "ISO Lead Auditor training",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title:
      "Helping Businesses Get ISO Certified in Uganda & East Africa | AM Quality Management Systems",
    description:
      "End-to-end ISO 9001, 14001, 45001 & 22000 certification consulting for organisations across East Africa — plus internationally recognised Lead Auditor training.",
    images: [
      {
        url: OG_IMAGE.src,
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        alt: OG_IMAGE.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Helping Businesses Get ISO Certified in Uganda & East Africa | AM Quality Management Systems",
    description:
      "End-to-end ISO 9001, 14001, 45001 & 22000 certification consulting across East Africa — plus internationally recognised Lead Auditor training.",
    images: [OG_IMAGE.src],
  },
  verification: {
    other: {
      "websitelaunches-verification": "e8efdcb4dcfe654017ca970ddc64a794",
    },
  },
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: abs("/amqms-v4-transparent.png"),
  description:
    "ISO certification consulting and Lead Auditor training across Uganda and East Africa.",
  areaServed: ["Uganda", "East Africa"],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+256707068533",
    contactType: "sales",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        {children}
      </body>
    </html>
  );
}
