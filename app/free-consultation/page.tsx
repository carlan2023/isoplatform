import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import ConsultForm from "@/app/components/ConsultForm";
import Footer from "@/app/components/Footer";
import SiteNav from "@/app/components/SiteNav";
import { jsonLdHtml } from "@/lib/seo";
import {
  CONTACT,
  FREE_CONSULTATION_PATH,
  SITE_NAME,
  SITE_URL,
  abs,
} from "@/lib/site";
import { MANAGEMENT_STANDARDS } from "@/lib/standards";
import { UGANDA_ISO_HUB_PATH } from "@/lib/uganda-paths";

const TITLE = "Book a free consultation";
const DESCRIPTION =
  "Book a free consultation with NAM QMS about ISO certification for your organisation in Uganda and East Africa. Call, WhatsApp, or send the form.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | ${SITE_NAME}` },
  description: DESCRIPTION,
  alternates: { canonical: FREE_CONSULTATION_PATH },
  openGraph: {
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: abs(FREE_CONSULTATION_PATH),
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
  },
};

const POINTS = [
  "Tell us the standard, the sites and who owns the system.",
  "We say what is already in place and what still needs training, documents or records.",
  "You leave with a next step. The consultation is not an audit and not a certificate.",
];

export default function FreeConsultationPage() {
  const pageLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: TITLE,
    description: DESCRIPTION,
    url: abs(FREE_CONSULTATION_PATH),
    mainEntity: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      telephone: CONTACT.phone,
      email: CONTACT.email,
    },
  };

  return (
    <main
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Georgia', serif" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(pageLd) }}
      />
      <SiteNav />

      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-14 items-start">
          <div>
            <p
              className="text-xs font-medium uppercase tracking-wide mb-4"
              style={{
                color: "#0f766e",
                fontFamily: "var(--font-geist-sans), sans-serif",
              }}
            >
              {SITE_NAME}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-6">
              Book a free consultation
            </h1>
            <p
              className="text-slate-600 text-lg leading-relaxed mb-8"
              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
            >
              Talk with NAM QMS about ISO certification for your organisation.
              We work with institutions across Uganda and East Africa. An
              independent certification body issues any ISO certificate. We do
              not.
            </p>
            <ul className="space-y-3 mb-8">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: "#0d9488" }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-slate-600 leading-relaxed"
                    style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                  >
                    {point}
                  </span>
                </li>
              ))}
            </ul>
            <div
              className="flex flex-col items-start gap-3 text-sm"
              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
            >
              <a
                href={`tel:${CONTACT.phone}`}
                className="inline-flex items-center gap-2 font-medium text-slate-900 hover:text-teal-700"
              >
                <Phone size={16} aria-hidden="true" />
                Call {CONTACT.phoneDisplay}
              </a>
              <a
                href={CONTACT.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium hover:opacity-80"
                style={{ color: "#128c4a" }}
              >
                WhatsApp {CONTACT.phoneDisplay}
              </a>
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-slate-600 underline underline-offset-4 hover:text-teal-700"
              >
                {CONTACT.email}
              </a>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 md:p-8">
            <h2 className="font-bold text-slate-900 text-xl mb-1">
              Send your details
            </h2>
            <p
              className="text-slate-500 text-sm mb-6"
              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
            >
              We reply within one working day. There is no charge for this
              consultation.
            </p>
            <ConsultForm />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            If you already know the standard
          </h2>
          <p
            className="text-slate-500 mb-8 max-w-2xl"
            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
          >
            Read the page for that standard, or see how an engagement runs,
            before you book.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MANAGEMENT_STANDARDS.map((standard) => (
              <Link
                key={standard.slug}
                href={`/certifications/${standard.slug}`}
                className="bg-white border border-slate-200 rounded-lg p-5 hover:border-teal-300"
              >
                <div className="font-bold text-slate-900">{standard.code}</div>
                <div
                  className="text-sm text-slate-500 mt-1"
                  style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                >
                  {standard.name}
                </div>
              </Link>
            ))}
            <Link
              href={UGANDA_ISO_HUB_PATH}
              className="bg-white border border-slate-200 rounded-lg p-5 hover:border-teal-300"
            >
              <div className="font-bold text-slate-900">ISO in Uganda</div>
              <div
                className="text-sm text-slate-500 mt-1"
                style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
              >
                Guides for organisations
              </div>
            </Link>
            <Link
              href="/internal-audit-training"
              className="bg-white border border-slate-200 rounded-lg p-5 hover:border-teal-300"
            >
              <div className="font-bold text-slate-900">
                Internal Audit Training
              </div>
              <div
                className="text-sm text-slate-500 mt-1"
                style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
              >
                For organisations, quoted separately
              </div>
            </Link>
            <Link
              href="/iso-certification-consulting#how-it-works"
              className="bg-white border border-slate-200 rounded-lg p-5 hover:border-teal-300 inline-flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-bold text-slate-900">How it works</div>
                <div
                  className="text-sm text-slate-500 mt-1"
                  style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                >
                  From the first conversation to the audit
                </div>
              </div>
              <ArrowRight size={16} className="text-teal-700 shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
