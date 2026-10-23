import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { ogImageMetadata } from "@/lib/media";
import { HUBSPOT_SCRIPT_SRC } from "@/lib/hubspot";
import { organizationJsonLd } from "@/lib/uganda-iso";
import { jsonLdHtml } from "@/lib/seo";

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
    default: "ISO Certification in Uganda & Lead Auditor Training | NAM QMS",
    template: `%s | NAM QMS`,
  },
  description:
    "Get your business ISO 9001, 14001, 45001 & 22000 certified across Uganda & East Africa — gap analysis, documentation and audit prep, end to end.",
  keywords: [
    "ISO certification Uganda",
    "ISO certification East Africa",
    "ISO 9001 certification",
    "ISO certification consulting",
    "get ISO certified",
    "ISO Lead Auditor training",
  ],
  applicationName: SITE_NAME,
  manifest: "/site.webmanifest",
  // Page-specific title, description, canonical and social URL live on each
  // route. Defaults here would otherwise be copied onto every page.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    images: [ogImageMetadata],
  },
  twitter: {
    card: "summary_large_image",
  },
  verification: {
    other: {
      "websitelaunches-verification": "e8efdcb4dcfe654017ca970ddc64a794",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(organizationJsonLd()) }}
        />
        {children}
        <Script
          id="hs-script-loader"
          src={HUBSPOT_SCRIPT_SRC}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
