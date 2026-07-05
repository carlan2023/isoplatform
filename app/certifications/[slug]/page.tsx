import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  ArrowRight,
  Award,
  CheckCircle2,
  Building2,
} from "lucide-react";
import ConsultForm from "@/app/components/ConsultForm";
import { SITE_NAME, abs } from "@/lib/site";
import {
  STANDARDS,
  getStandard,
  allStandardSlugs,
  type Standard,
} from "@/lib/standards";

export const revalidate = 3600;

export function generateStaticParams() {
  return allStandardSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const standard = getStandard(slug);
  if (!standard) return {};
  const path = `/certifications/${standard.slug}`;
  return {
    title: `${standard.metaTitle} | ${SITE_NAME}`,
    description: standard.metaDescription,
    keywords: standard.keywords,
    alternates: { canonical: path },
    openGraph: {
      title: `${standard.metaTitle} | ${SITE_NAME}`,
      description: standard.metaDescription,
      url: abs(path),
      siteName: SITE_NAME,
      type: "website",
    },
  };
}

export default async function CertificationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const standard = getStandard(slug);
  if (!standard) notFound();

  const path = `/certifications/${standard.slug}`;
  const related = STANDARDS.filter((s) => s.slug !== standard.slug);

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${standard.code} — ${standard.name}`,
    serviceType: `${standard.code} certification consulting`,
    provider: { "@type": "Organization", name: SITE_NAME, url: abs("/") },
    areaServed: [
      { "@type": "Country", name: "Uganda" },
      { "@type": "Place", name: "East Africa" },
    ],
    description: standard.metaDescription,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${standard.code} services`,
      itemListElement: standard.services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title },
      })),
    },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: standard.faqs.map((f) => ({
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
      {
        "@type": "ListItem",
        position: 3,
        name: standard.code,
        item: abs(path),
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
              href="/iso-certification-consulting"
              className="hover:text-teal-600 transition-colors"
            >
              Consulting
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
          <div
            className="text-xs text-slate-400 mb-6"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            <Link href="/" className="hover:text-teal-600">
              Home
            </Link>{" "}
            /{" "}
            <Link
              href="/iso-certification-consulting"
              className="hover:text-teal-600"
            >
              Consulting
            </Link>{" "}
            / <span className="text-slate-600">{standard.code}</span>
          </div>
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
              <ShieldCheck size={12} /> {standard.category}
            </div>
            <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
              {standard.heading}
            </h1>
            <p
              className="text-slate-500 text-lg leading-relaxed mb-8"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              {standard.intro}
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

      {/* WHO IT'S FOR + BENEFITS */}
      <section className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-start">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={20} className="text-teal-600" />
              <h2 className="text-2xl font-bold text-slate-900">
                Who {standard.code} is for
              </h2>
            </div>
            <p
              className="text-slate-600 leading-relaxed"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              {standard.whoFor}
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Why get certified
            </h2>
            <ul className="space-y-3">
              {standard.benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2
                    size={18}
                    className="text-teal-600 shrink-0 mt-0.5"
                  />
                  <span
                    className="text-sm text-slate-600"
                    style={{ fontFamily: "system-ui, sans-serif" }}
                  >
                    {b}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            What our {standard.code} engagement covers
          </h2>
          <p
            className="text-slate-500 mb-12 max-w-2xl"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            A complete engagement — from the first gap analysis to keeping you
            compliant year after year.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {standard.services.map((s) => (
              <div
                key={s.title}
                className="border border-slate-200 rounded-lg p-6 hover:border-teal-200 transition-colors"
              >
                <ShieldCheck size={22} className="text-teal-600 mb-4" />
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
            The road to {standard.code}
          </h2>
          <p
            className="text-slate-500 mb-12 max-w-2xl"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            A clear, five-stage path. We stay with you through every stage.
          </p>
          <div className="space-y-4">
            {standard.process.map((step) => (
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

      {/* REQUEST A QUOTE */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Request a {standard.code} quote
          </h2>
          <p
            className="text-slate-500 mb-10 max-w-2xl mx-auto"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            Every engagement is fixed-scope — no open-ended billing. Because
            cost depends on your size, systems and current maturity, we prepare
            a tailored proposal after a short scoping call. Send us your details
            and we&apos;ll get back to you within 24 hours.
          </p>
          <a
            href="#enquiry"
            className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-md font-medium transition-colors"
            style={{
              backgroundColor: "#0d9488",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Request a quote <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* ENQUIRY */}
      <section id="enquiry" className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Get a free {standard.code} consultation
            </h2>
            <p
              className="text-slate-500 leading-relaxed mb-8"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Tell us where your organisation is today and we&apos;ll get back to
              you within 24 hours with a clear, practical next step — no
              obligation.
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

          <div className="bg-white border border-slate-200 rounded-xl p-8">
            <h3 className="font-bold text-slate-900 text-lg mb-1">
              Request a quote
            </h3>
            <p
              className="text-slate-500 text-sm mb-6"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              We&apos;ll be in touch within 24 hours.
            </p>
            <ConsultForm defaultStandard={standard.enquiryLabel} />
          </div>
        </div>
      </section>

      {/* RELATED */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">
            Related standards
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((r: Standard) => (
              <Link
                key={r.slug}
                href={`/certifications/${r.slug}`}
                className="border border-slate-200 rounded-lg p-6 hover:border-teal-300 hover:shadow-sm transition-all"
              >
                <div className="text-lg font-bold text-slate-900 mb-1">
                  {r.code}
                </div>
                <div
                  className="text-sm text-slate-500 mb-3"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {r.name}
                </div>
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

      {/* FAQ */}
      <section className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">
            {standard.code} — frequently asked questions
          </h2>
          <div className="space-y-4">
            {standard.faqs.map((f) => (
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
