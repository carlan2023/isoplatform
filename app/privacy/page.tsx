import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/app/components/Footer";
import { SITE_NAME, CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} collects, uses and protects the personal information of visitors, learners and clients.`,
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "9 July 2026";

const SECTIONS = [
  {
    h: "1. Introduction",
    p: [
      `${SITE_NAME} ("we", "us", "our") is committed to protecting your privacy. This policy explains what personal information we collect when you use our website, enrol in a course, or request ISO certification consulting, and how we use and safeguard it.`,
    ],
  },
  {
    h: "2. Information we collect",
    p: [
      "We collect information you provide directly to us, including:",
    ],
    list: [
      "Contact details — name, email address, phone number and organisation, submitted through our enrolment or consultation forms.",
      "Enrolment details — the course selected, participant information and billing details needed to reserve a place.",
      "Payment information — processed securely by our third-party payment provider; we do not store full card details on our systems.",
      "Technical data — basic analytics such as pages visited, collected to improve the site.",
    ],
  },
  {
    h: "3. How we use your information",
    p: ["We use the information we collect to:"],
    list: [
      "Process course enrolments and consultation requests.",
      "Communicate with you about bookings, schedules and services you have requested.",
      "Provide, maintain and improve our website and services.",
      "Meet our legal, accounting and regulatory obligations.",
    ],
  },
  {
    h: "4. Sharing your information",
    p: [
      "We do not sell your personal information. We share it only with service providers who help us operate — for example our hosting, database and payment providers — and only to the extent needed to deliver our services, or where required by law.",
    ],
  },
  {
    h: "5. Data security & retention",
    p: [
      "We take reasonable technical and organisational measures to protect your information against loss, misuse and unauthorised access. We retain personal information only for as long as necessary to fulfil the purposes described in this policy or as required by law.",
    ],
  },
  {
    h: "6. Your rights",
    p: [
      "You may request access to, correction of, or deletion of the personal information we hold about you, and you may ask us to stop sending you marketing communications. To exercise any of these rights, contact us using the details below.",
    ],
  },
  {
    h: "7. Contact us",
    p: [
      `If you have any questions about this Privacy Policy or how we handle your information, contact us at ${CONTACT.email} or ${CONTACT.phoneDisplay}.`,
    ],
  },
];

export default function PrivacyPage() {
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
          Privacy Policy
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
              {s.list && (
                <ul
                  className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {s.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
