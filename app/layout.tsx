import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL, SITE_NAME, abs } from "@/lib/site";

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
      "AM Quality Management Systems | ISO Lead Auditor Training & Certification Consulting",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "ISO certification consulting and Lead Auditor training for organisations across Uganda and East Africa. We help businesses get ISO 9001, 14001, 45001 & 22000 certified. Trusted by 500+ professionals.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title:
      "AM Quality Management Systems | ISO Certification Consulting & Lead Auditor Training",
    description:
      "Helping businesses across East Africa get ISO certified — plus internationally recognised Lead Auditor training.",
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
