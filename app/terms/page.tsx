import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/app/components/Footer";
import { SITE_NAME, LEGAL_NAME, CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `The terms and conditions governing use of the ${SITE_NAME} website, course enrolments and services.`,
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "9 July 2026";

const SECTIONS = [
  {
    h: "1. Agreement to terms",
    p: [
      `These Terms & Conditions govern your use of the ${SITE_NAME} website and services operated by ${LEGAL_NAME}. By accessing this website, enrolling in a course, or engaging our services, you agree to be bound by these terms.`,
    ],
  },
  {
    h: "2. Use of the website",
    p: [
      "You agree to use this website only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use of the site. You must not attempt to gain unauthorised access to any part of the site, its servers, or any connected systems.",
    ],
  },
  {
    h: "3. Course enrolment & payment",
    p: [
      "Places on training courses are confirmed on receipt of payment through our authorised payment provider. Fees, inclusions and schedules are as stated on the relevant course page at the time of booking. Where a course is postponed or cancelled by us, we will offer a transfer to a future session or a refund.",
    ],
  },
  {
    h: "4. Consulting services",
    p: [
      "ISO certification consulting is delivered under a separate written scope of work agreed with your organisation. Certification decisions are made solely by independent, accredited certification bodies; we prepare and support your organisation but do not issue certificates or guarantee a certification outcome.",
    ],
  },
  {
    h: "5. Intellectual property",
    p: [
      `All content on this website — including text, graphics, logos and training materials — is the property of ${LEGAL_NAME} or its licensors and is protected by applicable intellectual property laws. You may not reproduce or redistribute it without our prior written permission.`,
    ],
  },
  {
    h: "6. Disclaimers & limitation of liability",
    p: [
      "The website and its content are provided on an \"as is\" basis without warranties of any kind. To the fullest extent permitted by law, we are not liable for any indirect or consequential loss arising from your use of the website or reliance on its content.",
    ],
  },
  {
    h: "7. Governing law",
    p: [
      "These terms are governed by the laws of Uganda, and any disputes arising in connection with them are subject to the exclusive jurisdiction of the Ugandan courts.",
    ],
  },
  {
    h: "8. Changes to these terms",
    p: [
      "We may update these terms from time to time. The version published on this page at the time you use the site is the version that applies.",
    ],
  },
  {
    h: "9. Contact us",
    p: [
      `For questions about these Terms & Conditions, contact us at ${CONTACT.email} or ${CONTACT.phoneDisplay}.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <main
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Georgia', serif" }}
    >
      {/* NAV */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <img
              src="/amqms-v4-transparent.png"
              alt={SITE_NAME}
              className="h-12 w-auto"
            />
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-teal-600 transition-colors"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            Home
          </Link>
        </div>
      </nav>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          Terms &amp; Conditions
        </h1>
        <p
          className="text-sm text-slate-500 mb-10"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Last updated {LAST_UPDATED}
        </p>

        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <div key={s.h}>
              <h2 className="text-xl font-bold text-slate-900 mb-3">{s.h}</h2>
              {s.p.map((para) => (
                <p
                  key={para}
                  className="text-slate-600 leading-relaxed mb-3"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {para}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
