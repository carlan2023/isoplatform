import type { Metadata } from "next";
import Link from "next/link";
import ConsultForm from "@/app/components/ConsultForm";
import {
  ShieldCheck,
  ArrowRight,
  ClipboardCheck,
  FileText,
  Users,
  Search,
  RefreshCw,
  Award,
} from "lucide-react";
import { SITE_NAME, abs } from "@/lib/site";
import { STANDARDS as SECURITY_STANDARDS } from "@/lib/standards";

const TITLE = "ISO Certification Consulting in Uganda & East Africa";
const DESCRIPTION =
  "We help businesses across Uganda and East Africa achieve ISO 9001, ISO 14001, ISO 45001 and ISO 22000 certification — gap analysis, documentation, internal audits and certification-audit preparation, end to end.";

export const metadata: Metadata = {
  title: `${TITLE} | ${SITE_NAME}`,
  description: DESCRIPTION,
  alternates: { canonical: "/iso-certification-consulting" },
  openGraph: {
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: abs("/iso-certification-consulting"),
    siteName: SITE_NAME,
    type: "website",
  },
};

const SERVICES = [
  {
    icon: Search,
    title: "ISO Gap Analysis",
    desc: "We benchmark your current systems against the ISO standard and deliver a prioritised, practical action plan to close every gap.",
  },
  {
    icon: FileText,
    title: "Documentation & Management System Design",
    desc: "We develop the policies, procedures, and records the standard requires — tailored to how your organisation actually operates.",
  },
  {
    icon: Users,
    title: "Internal Auditor Training",
    desc: "We train your team to run effective internal audits so you maintain compliance year-round, not just at audit time.",
  },
  {
    icon: ClipboardCheck,
    title: "Certification Audit Preparation",
    desc: "We run mock audits and coach your team so you walk into the certification body's audit with evidence and confidence.",
  },
  {
    icon: RefreshCw,
    title: "Post-Certification Maintenance",
    desc: "We support you through surveillance audits and continual improvement so your certificate stays valid and adds value.",
  },
];

const STANDARDS = [
  { code: "ISO 9001", name: "Quality Management" },
  { code: "ISO 14001", name: "Environmental Management" },
  { code: "ISO 45001", name: "Occupational Health & Safety" },
  { code: "ISO 22000", name: "Food Safety Management" },
];

const STEPS = [
  {
    n: "01",
    title: "Gap analysis",
    desc: "We assess where you are today and map the fastest compliant route to certification.",
  },
  {
    n: "02",
    title: "Implementation",
    desc: "We build your management system, documentation, and processes alongside your team.",
  },
  {
    n: "03",
    title: "Internal audit",
    desc: "We train your internal auditors and run a full internal audit to catch issues early.",
  },
  {
    n: "04",
    title: "Certification audit",
    desc: "We prepare you for the certification body's Stage 1 and Stage 2 audits and support you through them.",
  },
  {
    n: "05",
    title: "Maintain & improve",
    desc: "We keep you certified through surveillance audits and ongoing improvement.",
  },
];

const FAQS = [
  {
    q: "How long does it take to get ISO certified?",
    a: "For most small to mid-sized organisations, ISO certification takes roughly 3 to 6 months from gap analysis to the certification audit, depending on the standard, the size of your operation, and how mature your current processes are.",
  },
  {
    q: "Which ISO standards do you help with?",
    a: "We support ISO 9001 (Quality), ISO 14001 (Environmental), ISO 45001 (Occupational Health & Safety), and ISO 22000 (Food Safety). We also help organisations pursuing several standards at once through an integrated management system.",
  },
  {
    q: "Do you work with businesses outside Uganda?",
    a: "Yes. We are based in Uganda and work with organisations across East Africa, both on-site and remotely.",
  },
  {
    q: "Will we actually pass the certification audit?",
    a: "Certification is issued by an independent certification body, not by us. Our job is to prepare you thoroughly — through documentation, internal audits, and mock audits — so you meet every requirement before the audit. That preparation is why our clients pass.",
  },
];

export default function ConsultingPage() {
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "ISO Certification Consulting",
    serviceType: "ISO certification consulting",
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: abs("/"),
    },
    areaServed: [
      { "@type": "Country", name: "Uganda" },
      { "@type": "Place", name: "East Africa" },
    ],
    description: DESCRIPTION,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "ISO certification services",
      itemListElement: SERVICES.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title },
      })),
    },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "ISO Certification Consulting",
        item: abs("/iso-certification-consulting"),
      },
    ],
  };

  return (
    <main
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Georgia', serif" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* NAV */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <img
              src="/amqms-v4-transparent.png"
              alt="AM Quality Management Systems"
              className="h-12 w-auto"
            />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <Link href="/" className="hover:text-teal-600 transition-colors">
              Home
            </Link>
            <Link
              href="/#courses"
              className="hover:text-teal-600 transition-colors"
            >
              Training
            </Link>
            <a href="#enquiry" className="hover:text-teal-600 transition-colors">
              Get a Quote
            </a>
            <Link
              href="/login"
              className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 transition-colors"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Student Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <div
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border mb-6"
              style={{
                backgroundColor: "#f0fdfa",
                borderColor: "#99f6e4",
                color: "#0f766e",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              <ShieldCheck size={12} /> ISO Certification Consulting
            </div>
            <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
              Helping businesses get{" "}
              <span style={{ color: "#0d9488" }}>ISO certified</span> in East
              Africa
            </h1>
            <p
              className="text-slate-500 text-lg leading-relaxed mb-8"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              We guide your organisation from first assessment to a certified
              management system — ISO 9001, ISO 14001, ISO 45001 and ISO 22000.
              Gap analysis, documentation, internal audits and certification-audit
              preparation, handled end to end so your team can keep running the
              business.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#enquiry"
                className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-md font-medium transition-colors"
                style={{
                  backgroundColor: "#0d9488",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Get a free consultation <ArrowRight size={16} />
              </a>
              <a
                href="https://wa.me/256707068533"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 text-sm underline underline-offset-4"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                Or chat with us on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STANDARDS */}
      <section className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            ISO standards we certify organisations to
          </h2>
          <p
            className="text-slate-500 mb-10 max-w-2xl"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            Whether you need one standard or an integrated management system
            covering several, we take you all the way to certification.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STANDARDS.map((s) => (
              <div
                key={s.code}
                className="bg-white border border-slate-200 rounded-lg p-6"
              >
                <div className="text-xl font-bold text-slate-900 mb-1">
                  {s.code}
                </div>
                <div
                  className="text-sm text-slate-500"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {s.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INFORMATION SECURITY & DATA PROTECTION — dedicated landing pages */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border mb-6"
            style={{
              backgroundColor: "#f0fdfa",
              borderColor: "#99f6e4",
              color: "#0f766e",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <ShieldCheck size={12} /> Information Security & Data Protection
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            ISO 27001, ISO 27701 & PCI DSS
          </h2>
          <p
            className="text-slate-500 mb-10 max-w-2xl"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            Handling sensitive or payment data? We also take organisations
            through information-security and data-protection certification —
            each with its own dedicated programme.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {SECURITY_STANDARDS.map((s) => (
              <Link
                key={s.slug}
                href={`/certifications/${s.slug}`}
                className="border border-slate-200 rounded-lg p-6 hover:border-teal-300 hover:shadow-sm transition-all"
              >
                <div className="text-xl font-bold text-slate-900 mb-1">
                  {s.code}
                </div>
                <div
                  className="text-sm font-medium text-slate-600 mb-3"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {s.name}
                </div>
                <p
                  className="text-sm text-slate-500 leading-relaxed mb-4"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {s.tagline}
                </p>
                <span
                  className="inline-flex items-center gap-1 text-sm text-teal-600 font-medium"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  Learn more <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            What our ISO certification consulting covers
          </h2>
          <p
            className="text-slate-500 mb-12 max-w-2xl"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            A complete engagement — from the first gap analysis to keeping your
            certificate valid year after year.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="border border-slate-200 rounded-lg p-6 hover:border-teal-200 transition-colors"
              >
                <s.icon size={22} className="text-teal-600 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                <p
                  className="text-sm text-slate-500 leading-relaxed"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            How the road to ISO certification works
          </h2>
          <p
            className="text-slate-500 mb-12 max-w-2xl"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            A clear, five-stage path. We stay with you through every stage.
          </p>
          <div className="space-y-4">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="flex items-start gap-6 bg-white border border-slate-200 rounded-lg p-6"
              >
                <div
                  className="text-2xl font-bold shrink-0"
                  style={{ color: "#0d9488" }}
                >
                  {step.n}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">
                    {step.title}
                  </h3>
                  <p
                    className="text-sm text-slate-500 leading-relaxed"
                    style={{ fontFamily: "system-ui, sans-serif" }}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ENQUIRY */}
      <section id="enquiry" className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Get a free ISO certification consultation
            </h2>
            <p
              className="text-slate-500 leading-relaxed mb-8"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Tell us where your organisation is in the certification journey and
              we&apos;ll get back to you within 24 hours with a clear, practical
              next step — no obligation.
            </p>
            <div className="space-y-3">
              {[
                "Accredited consultants and practising auditors",
                "Case studies from real East African industry",
                "Fixed-scope proposals — no open-ended billing",
              ].map((point) => (
                <div key={point} className="flex items-center gap-3">
                  <Award size={16} className="text-teal-600 shrink-0" />
                  <span
                    className="text-sm text-slate-600"
                    style={{ fontFamily: "system-ui, sans-serif" }}
                  >
                    {point}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8">
            <h3 className="font-bold text-slate-900 text-lg mb-1">
              Request a consultation
            </h3>
            <p
              className="text-slate-500 text-sm mb-6"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Tell us about your organisation and we&apos;ll be in touch within 24
              hours.
            </p>
            <ConsultForm />
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span
                  className="bg-slate-50 px-3 text-xs text-slate-400"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  or reach us directly
                </span>
              </div>
            </div>
            <a
              href="https://wa.me/256707068533"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 border-2 font-semibold py-3 rounded-lg transition-colors hover:bg-green-50 text-sm"
              style={{
                borderColor: "#25d366",
                color: "#25d366",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#25d366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">
            ISO certification — frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((f) => (
              <div
                key={f.q}
                className="bg-white border border-slate-200 rounded-lg p-6"
              >
                <h3 className="font-bold text-slate-900 mb-2">{f.q}</h3>
                <p
                  className="text-sm text-slate-500 leading-relaxed"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-sm flex items-center justify-center"
              style={{ backgroundColor: "#0d9488" }}
            >
              <ShieldCheck size={13} className="text-white" />
            </div>
            <span className="text-white font-bold">Alrena Group</span>
          </div>
          <p className="text-sm" style={{ fontFamily: "system-ui, sans-serif" }}>
            © {new Date().getFullYear()} Alrena Group. All rights reserved.
          </p>
          <Link
            href="/"
            className="text-sm hover:text-white transition-colors"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            Home
          </Link>
        </div>
      </footer>
    </main>
  );
}
