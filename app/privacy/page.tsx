import type { Metadata } from "next";
import Footer from "@/app/components/Footer";
import SiteNav from "@/app/components/SiteNav";
import { SITE_NAME, LEGAL_NAME, CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} collects, uses and protects personal information from enrolment, mobile-money payments, HubSpot forms and analytics cookies.`,
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "20 October 2026";

const sans = { fontFamily: "var(--font-geist-sans), sans-serif" } as const;

type Section = {
  h: string;
  p: string[];
  list?: string[];
};

const SECTIONS: Section[] = [
  {
    h: "1. Who we are",
    p: [
      `${SITE_NAME} (${LEGAL_NAME}) is a training and consulting company in Uganda. We help organisations prepare for ISO certification and we train auditors. This policy explains how we handle personal data when you use this website, enrol on a course, apply for consulting, or contact us.`,
      "We handle personal data in line with the Data Protection and Privacy Act, 2019 of Uganda.",
    ],
  },
  {
    h: "2. Data collected when you enrol",
    p: [
      "When you enrol on a course, or when an organisation books training for its staff, we collect the details needed to reserve the place. That includes your name, phone number and email address, your organisation where you provide it, the course and number of participants, and the mobile-money number used to pay.",
      "Certification applications on this website also ask for contact details, organisation details and the service you want, so we can reply and prepare a response.",
    ],
  },
  {
    h: "3. Payments via Broracks",
    p: [
      "Course fees are collected by mobile money, on MTN and Airtel Uganda, through Broracks. Broracks sends a payment prompt to the mobile-money number you give us and tells us whether the payment succeeded. We use that result to confirm the booking.",
      "We do not receive or store your mobile-money PIN. You authorise the payment on your own phone.",
    ],
  },
  {
    h: "4. HubSpot forms",
    p: [
      "Some requests, including the free ISO gap analysis, are collected on forms hosted by HubSpot. If you submit a HubSpot form, the information you enter on that form is processed by HubSpot for us. We use it to respond to the request and to provide the related service.",
    ],
  },
  {
    h: "5. Analytics cookies",
    p: [
      "This website loads HubSpot analytics. HubSpot may set cookies that record pages visited, how you reached the site, and similar usage information, so we can see which pages are useful.",
      "You can refuse or delete cookies in your browser. If you sign in to the student portal, the site also uses cookies that are needed to keep that session. Those cookies are not used to advertise to you.",
    ],
  },
  {
    h: "6. Certificate verification",
    p: [
      "When NAM QMS issues a certificate of completion for a training course, we store the certificate ID, the full name of the holder, the course, the training dates, the issue date and whether the certificate is valid or revoked.",
      "Anyone with the certificate ID can look it up on this website and see those details. That page does not show an email address or a phone number, and it does not list other certificates.",
      "A NAM QMS certificate of completion records training only. It is not an ISO certificate, and NAM QMS does not certify organisations.",
    ],
  },
  {
    h: "7. How we use personal data",
    p: ["We use the personal data described above to:"],
    list: [
      "Process enrolments, certification applications and consultation requests.",
      "Confirm mobile-money payments and keep a record of the booking.",
      "Contact you about a service you asked for.",
      "Operate and improve this website.",
      "Meet legal, accounting and regulatory duties.",
    ],
  },
  {
    h: "8. Who we share it with",
    p: [
      "We do not sell personal data. We share it only as far as needed to run the service:",
    ],
    list: [
      "Broracks, to collect the mobile-money payment and report the result.",
      "HubSpot, for forms you submit there and for the analytics cookies described above.",
      "Hosting, database and email providers that keep the site and booking messages working.",
      "A public authority, where the law of Uganda requires us to disclose it.",
    ],
  },
  {
    h: "9. Retention and security",
    p: [
      "We keep personal data only for as long as we need it for the booking, the service you asked for, or a legal duty such as accounting. We then delete it or reduce it so it no longer identifies you.",
      "We take reasonable technical and organisational measures against loss, misuse and unauthorised access. No website can guarantee perfect security.",
    ],
  },
  {
    h: "10. Your rights",
    p: [
      "Under the Data Protection and Privacy Act, 2019 you may ask us for a copy of the personal data we hold about you, ask us to correct it, or ask us to delete it where the law allows. Where we rely on your consent, you may withdraw that consent. You may also object to processing that is not required to deliver a service you asked for.",
      "To use these rights, contact us with the details below. If you are not satisfied with our response, you may complain to the Personal Data Protection Office established under the Act.",
    ],
  },
  {
    h: "11. Contact",
    p: [
      `Questions about this policy, or a request about your personal data, can be sent to ${CONTACT.email}, or by phone or WhatsApp on ${CONTACT.phoneDisplay}. ${SITE_NAME} is based in ${CONTACT.location}.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white" style={{ fontFamily: "'Georgia', serif" }}>
      <SiteNav />

      <section className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10" style={sans}>
          Last updated {LAST_UPDATED}
        </p>

        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <div key={s.h}>
              <h2 className="text-xl font-bold text-slate-900 mb-3">{s.h}</h2>
              {s.p.map((para) => (
                <p key={para} className="text-slate-600 leading-relaxed mb-3" style={sans}>
                  {para}
                </p>
              ))}
              {s.list && (
                <ul
                  className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed"
                  style={sans}
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
