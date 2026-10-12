import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Award,
  Check,
  ChevronDown,
  MapPin,
  MessageCircle,
  Users,
} from "lucide-react";
import Footer from "@/app/components/Footer";
import SiteNav from "@/app/components/SiteNav";
import { CONTACT, SITE_URL, abs } from "@/lib/site";
import { IMG } from "@/lib/media";

const TITLE = "ISO Internal Audit Training for Companies | NAM QMS";
const DESCRIPTION =
  "Train your own staff as ISO internal auditors for ISO 9001, 14001, 45001, 22000 and 27001. In-house or at our Kampala venue. Request a quote from NAM QMS.";

const QUOTE_MAILTO = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
  "Internal Audit Training – Quote Request",
)}`;
const WHATSAPP_QUOTE = `${CONTACT.whatsapp}?text=${encodeURIComponent(
  "Hi NAM QMS, we'd like a quote for Internal Audit training for our team",
)}`;

const GAP_ANALYSIS_HREF = "/iso-certification-consulting";

const sans = { fontFamily: "system-ui, sans-serif" } as const;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/internal-audit-training" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: abs("/internal-audit-training"),
    siteName: "NAM QMS",
    type: "website",
    images: [
      {
        url: IMG.internalAuditTraining.src,
        width: IMG.internalAuditTraining.width,
        height: IMG.internalAuditTraining.height,
        alt: IMG.internalAuditTraining.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [IMG.internalAuditTraining.src],
  },
};

const AUDIENCE = [
  {
    title: "QA and compliance teams",
    desc: "Quality, HSE, food safety and information security officers who run or support your management system.",
    icon: Users,
  },
  {
    title: "Management representatives and department heads",
    desc: "People who own processes and need to audit them objectively.",
    icon: Award,
  },
  {
    title: "Companies preparing for or maintaining certification",
    desc: "Organisations heading into a first certification audit, a surveillance audit or recertification.",
    icon: Check,
  },
];

const OUTCOMES = [
  "Plan an annual internal audit programme based on risk",
  "Prepare audit checklists against the standard and your own procedures",
  "Run opening and closing meetings and interview staff with confidence",
  "Gather objective evidence and grade nonconformities correctly",
  "Write clear audit reports that drive corrective action",
  "Follow up corrective actions and feed results into management review",
];

const STANDARDS = [
  { code: "ISO 9001", label: "Quality Management", slug: "iso-9001" },
  { code: "ISO 14001", label: "Environmental Management", slug: "iso-14001" },
  {
    code: "ISO 45001",
    label: "Occupational Health & Safety",
    slug: "iso-45001",
  },
  { code: "ISO 22000", label: "Food Safety", slug: "iso-22000" },
  { code: "ISO 27001", label: "Information Security", slug: "iso-27001" },
];

const FORMATS = [
  {
    title: "In-house at your premises",
    desc: "We come to your site anywhere in Uganda or East Africa. Practice audits use your own processes and documents.",
    icon: MapPin,
  },
  {
    title: "At our venue in Kampala",
    desc: "Send your team to us for focused training away from daily work.",
    icon: Users,
  },
];

const STEPS = [
  {
    n: "01",
    title: "Tell us your standard, team size and preferred format",
  },
  {
    n: "02",
    title: "We send a tailored quote and course outline",
  },
  {
    n: "03",
    title: "We deliver the training, in-house or at our venue",
  },
  {
    n: "04",
    title: "Your team runs its first internal audit, with our support if you need it",
  },
];

const FAQS: { q: string; a: ReactNode; text: string }[] = [
  {
    q: "Who should attend?",
    text: "Anyone who will audit your management system: QA and compliance officers, HSE staff, department heads and management representatives. No prior audit experience is needed.",
    a: "Anyone who will audit your management system: QA and compliance officers, HSE staff, department heads and management representatives. No prior audit experience is needed.",
  },
  {
    q: "Where is the training delivered?",
    text: "In-house at your premises anywhere in Uganda or East Africa, or at our venue in Kampala.",
    a: "In-house at your premises anywhere in Uganda or East Africa, or at our venue in Kampala.",
  },
  {
    q: "Which standards do you cover?",
    text: "ISO 9001, ISO 14001, ISO 45001, ISO 22000 and ISO 27001, individually or as an integrated management system.",
    a: "ISO 9001, ISO 14001, ISO 45001, ISO 22000 and ISO 27001, individually or as an integrated management system.",
  },
  {
    q: "How much does it cost and how long is it?",
    text: "It depends on the standard, the number of staff and the format. Send us those details and we will reply with a tailored quote and schedule.",
    a: "It depends on the standard, the number of staff and the format. Send us those details and we will reply with a tailored quote and schedule.",
  },
  {
    q: "Do participants get a certificate?",
    text: "Yes, a NAM QMS certificate of completion.",
    a: "Yes, a NAM QMS certificate of completion.",
  },
  {
    q: "We also need to get certified. Can you help?",
    text: "Yes. ISO certification consulting is our core service. Book a free gap analysis and we will show you exactly what it takes.",
    a: (
      <>
        Yes. ISO certification consulting is our core service.{" "}
        <Link
          href={GAP_ANALYSIS_HREF}
          className="font-medium underline underline-offset-2"
          style={{ color: "#0f766e" }}
        >
          Book a free gap analysis
        </Link>{" "}
        and we will show you exactly what it takes.
      </>
    ),
  },
];

function QuoteButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={QUOTE_MAILTO}
      className={`inline-flex items-center justify-center gap-2 text-white px-6 py-3 rounded-md font-medium transition-colors hover:bg-teal-700 ${className}`}
      style={{ backgroundColor: "#0d9488", ...sans }}
    >
      Request a quote for your team <ArrowRight size={16} aria-hidden="true" />
    </a>
  );
}

function WhatsAppButton({
  label,
  onDark = false,
}: {
  label: string;
  onDark?: boolean;
}) {
  return (
    <a
      href={WHATSAPP_QUOTE}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-medium border transition-colors"
      style={{
        ...sans,
        borderColor: onDark ? "#ccfbf1" : "#0f766e",
        color: onDark ? "#ccfbf1" : "#0f766e",
        backgroundColor: "transparent",
      }}
    >
      <MessageCircle size={16} aria-hidden="true" />
      {label}
    </a>
  );
}

export default function InternalAuditTrainingPage() {
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Internal Audit Training for Companies",
    serviceType: "ISO internal audit training",
    provider: {
      "@type": "Organization",
      name: "NAM QMS",
      url: SITE_URL,
    },
    areaServed: [
      { "@type": "Country", name: "Uganda" },
      { "@type": "Place", name: "East Africa" },
    ],
    description: DESCRIPTION,
    url: abs("/internal-audit-training"),
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.text },
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
        name: "Internal Audit Training",
        item: abs("/internal-audit-training"),
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

      <SiteNav />

      {/* HERO */}
      <section style={{ backgroundColor: "#ccfbf1" }}>
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-24 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <p
              className="text-sm font-medium mb-4"
              style={{ color: "#0f766e", ...sans }}
            >
              Corporate training · In-house at your site or at our Kampala venue
            </p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-slate-900">
              Internal Audit Training for Your Team
            </h1>
            <p
              className="text-slate-600 text-lg leading-relaxed mb-8"
              style={sans}
            >
              Build your own ISO internal audit team. We train your staff to
              plan, run and report internal audits that keep your management
              system working and your certificate safe.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <QuoteButton />
              <WhatsAppButton label="Book a call on WhatsApp" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-teal-100 shadow-sm bg-white aspect-[4/3]">
            <Image
              src={IMG.internalAuditTraining.src}
              alt={IMG.internalAuditTraining.alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section style={{ backgroundColor: "#0f172a" }}>
        <div className="max-w-4xl mx-auto px-6 py-10 text-center">
          <p
            className="text-sm md:text-base leading-relaxed"
            style={{ color: "#ccfbf1", ...sans }}
          >
            500+ auditors trained · Exemplar Global &amp; IRCA certified trainers
            · 10+ years of ISO experience in East Africa
          </p>
          <p className="mt-4">
            <Link
              href={GAP_ANALYSIS_HREF}
              className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4 hover:opacity-80"
              style={{ color: "#d4a017", ...sans }}
            >
              Not certified yet? Book a free ISO gap analysis
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </p>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-10">
            Who it&apos;s for
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {AUDIENCE.map((item) => (
              <article
                key={item.title}
                className="border border-slate-200 rounded-lg p-6 bg-white"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#ccfbf1" }}
                >
                  <item.icon size={20} style={{ color: "#0f766e" }} aria-hidden="true" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed" style={sans}>
                  {item.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section className="border-b border-slate-100" style={{ backgroundColor: "#f8fafc" }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-10">
            What your team will be able to do
          </h2>
          <ul className="grid md:grid-cols-2 gap-4">
            {OUTCOMES.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 bg-white border border-slate-200 rounded-lg px-5 py-4"
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#ccfbf1", color: "#0f766e" }}
                >
                  <Check size={14} aria-hidden="true" />
                </span>
                <span className="text-sm text-slate-700 leading-relaxed" style={sans}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* STANDARDS */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-10">
            Standards covered
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {STANDARDS.map((s) => (
              <Link
                key={s.code}
                href={`/certifications/${s.slug}`}
                className="group block border border-slate-200 rounded-lg p-6 bg-white transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-teal-200"
              >
                <div className="text-2xl font-bold text-slate-900 mb-1 group-hover:text-teal-700 transition-colors">
                  {s.code}
                </div>
                <div className="text-sm text-slate-500" style={sans}>
                  {s.label}
                </div>
              </Link>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-6" style={sans}>
            Integrated management system audits (for example 9001 + 14001 +
            45001) on request.
          </p>
        </div>
      </section>

      {/* DELIVERY */}
      <section className="border-b border-slate-100" style={{ backgroundColor: "#f8fafc" }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-10">
            How it&apos;s delivered
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {FORMATS.map((item) => (
              <article
                key={item.title}
                className="bg-white border border-slate-200 rounded-lg p-6"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#ccfbf1" }}
                >
                  <item.icon size={20} style={{ color: "#0f766e" }} aria-hidden="true" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed" style={sans}>
                  {item.desc}
                </p>
              </article>
            ))}
          </div>
          <p
            className="text-sm text-slate-600 mt-6"
            style={sans}
          >
            Every participant who completes the course receives a NAM QMS
            certificate of completion.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-10">
            How it works
          </h2>
          <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="border border-slate-200 rounded-lg p-6 bg-white"
              >
                <div
                  className="text-2xl font-bold mb-3"
                  style={{ color: "#0d9488" }}
                >
                  {step.n}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed" style={sans}>
                  {step.title}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group border border-slate-200 rounded-lg bg-slate-50"
              >
                <summary
                  className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-bold text-slate-900 [&::-webkit-details-marker]:hidden"
                >
                  <span>{f.q}</span>
                  <ChevronDown
                    size={18}
                    className="shrink-0 text-teal-700 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div
                  className="px-6 pb-5 text-sm text-slate-600 leading-relaxed"
                  style={sans}
                >
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        style={{
          backgroundColor: "#0f172a",
          borderTop: "4px solid #d4a017",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2
            className="text-3xl md:text-4xl font-bold leading-tight mb-4"
            style={{ color: "#ccfbf1" }}
          >
            Build an internal audit team your certification body will respect
          </h2>
          <p
            className="text-base leading-relaxed mb-8"
            style={{ color: "#ccfbf1", ...sans }}
          >
            Tell us your standard and team size, and we&apos;ll send a quote
            within one working day.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <QuoteButton />
            <WhatsAppButton label={`WhatsApp ${CONTACT.phoneDisplay}`} onDark />
          </div>
          <p className="mt-8 text-sm" style={{ color: "#ccfbf1", ...sans }}>
            <a href={QUOTE_MAILTO} className="underline underline-offset-4 hover:opacity-80">
              {CONTACT.email}
            </a>
            {" · "}
            <a
              href={WHATSAPP_QUOTE}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:opacity-80"
            >
              {CONTACT.phoneDisplay}
            </a>
            {" · "}
            {CONTACT.location}
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
