import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import Footer from "@/app/components/Footer";
import SiteNav from "@/app/components/SiteNav";
import { ogImageMetadata } from "@/lib/media";
import { jsonLdHtml } from "@/lib/seo";
import { SITE_NAME, abs } from "@/lib/site";
import {
  LEAD_AUDITOR_COURSE_PAGES,
  UGANDA_ISO_HUB_PATH,
  UGANDA_ISO_STANDARDS,
  ugandaIsoJsonLd,
  type UgandaIsoPage,
} from "@/lib/uganda-iso";

const sans = { fontFamily: "var(--font-geist-sans), sans-serif" } as const;

const LINK_MARKUP = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;

const FEE_LINK: Record<string, { href: string; label: string }> = {
  [UGANDA_ISO_HUB_PATH]: {
    href: "/#courses",
    label: "Upcoming courses and fees",
  },
  "/iso-9001-certification-uganda": {
    href: LEAD_AUDITOR_COURSE_PAGES.iso9001.path,
    label: "ISO 9001 Lead Auditor fees",
  },
  "/iso-14001-certification-uganda": {
    href: LEAD_AUDITOR_COURSE_PAGES.iso14001.path,
    label: "ISO 14001 Lead Auditor fees",
  },
  "/iso-27001-certification-uganda": {
    href: LEAD_AUDITOR_COURSE_PAGES.iso27001.path,
    label: "ISO 27001 Lead Auditor fees",
  },
  "/iso-45001-certification-uganda": {
    href: LEAD_AUDITOR_COURSE_PAGES.iso45001.path,
    label: "ISO 45001 lead auditor course fees",
  },
  "/iso-13485-certification-uganda": {
    href: "/internal-auditor-courses",
    label: "Internal auditor course fees",
  },
};

export function ugandaIsoMetadata(page: UgandaIsoPage): Metadata {
  const title = `${page.metaTitle} | ${SITE_NAME}`;
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: page.path },
    openGraph: {
      title,
      description: page.metaDescription,
      url: abs(page.path),
      siteName: SITE_NAME,
      type: "website",
      images: [ogImageMetadata],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: page.metaDescription,
      images: [ogImageMetadata.url],
    },
  };
}

function RichText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const markup = new RegExp(LINK_MARKUP.source, "g");
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(markup)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const href = match[1];
    const label = match[2];
    const external = href.startsWith("http");
    nodes.push(
      external ? (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline underline-offset-2"
          style={{ color: "#0f766e" }}
        >
          {label}
        </a>
      ) : (
        <Link
          key={key}
          href={href}
          className="font-medium underline underline-offset-2"
          style={{ color: "#0f766e" }}
        >
          {label}
        </Link>
      ),
    );
    last = index + match[0].length;
    key += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

export default function UgandaIsoLanding({ page }: { page: UgandaIsoPage }) {
  const ld = ugandaIsoJsonLd(page);
  const fee = FEE_LINK[page.path];
  const related = UGANDA_ISO_STANDARDS.filter((item) => item.path !== page.path);

  return (
    <main
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Georgia', serif" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(ld.organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(ld.service) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(ld.faq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(ld.breadcrumb) }}
      />

      <SiteNav />

      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="text-xs text-slate-400 mb-6"
              style={sans}
            >
              <Link href="/" className="hover:text-teal-600">
                Home
              </Link>
              <span aria-hidden="true"> / </span>
              {page.kind === "standard" ? (
                <>
                  <Link
                    href={UGANDA_ISO_HUB_PATH}
                    className="hover:text-teal-600"
                  >
                    ISO certification in Uganda
                  </Link>
                  <span aria-hidden="true"> / </span>
                  <span className="text-slate-600">{page.code}</span>
                </>
              ) : (
                <span className="text-slate-600">ISO certification in Uganda</span>
              )}
            </nav>
            <div
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border mb-6"
              style={{
                backgroundColor: "#f0fdfa",
                borderColor: "#99f6e4",
                color: "#0f766e",
                ...sans,
              }}
            >
              <Building2 size={12} aria-hidden="true" />
              {page.eyebrow}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-6">
              {page.h1}
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed mb-8" style={sans}>
              <RichText text={page.lede} />
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={page.gapAnalysisHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-md font-medium transition-colors hover:bg-teal-700"
                style={{ backgroundColor: "#0d9488", ...sans }}
              >
                Free ISO gap analysis <ArrowRight size={16} aria-hidden="true" />
              </a>
              <Link
                href="/internal-audit-training"
                className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-6 py-3 rounded-md font-medium transition-colors hover:border-teal-300 hover:text-teal-700"
                style={sans}
              >
                In-house team training
              </Link>
              {fee && (
                <Link
                  href={fee.href}
                  className="text-slate-600 text-sm underline underline-offset-4"
                  style={sans}
                >
                  {fee.label}
                </Link>
              )}
            </div>
          </div>
          <Image
            src={page.image.src}
            width={page.image.width}
            height={page.image.height}
            alt={page.image.alt}
            priority
            unoptimized={page.image.src.endsWith(".svg")}
            sizes="(max-width: 768px) 100vw, 45vw"
            className="w-full h-auto rounded-xl border border-slate-200 shadow-sm"
          />
        </div>
      </section>

      {page.sections.map((section, index) => (
        <section
          key={section.heading}
          className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
        >
          <div className="max-w-3xl mx-auto px-6 py-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              {section.heading}
            </h2>
            <div className="space-y-5">
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 80)}
                  className="text-slate-600 leading-relaxed"
                  style={sans}
                >
                  <RichText text={paragraph} />
                </p>
              ))}
            </div>
            {section.bullets && section.bullets.length > 0 && (
              <ul className="mt-6 space-y-3">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <CheckCircle2
                      size={18}
                      className="text-teal-600 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-slate-600" style={sans}>
                      <RichText text={bullet} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}

      <section className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">
            {page.kind === "hub"
              ? "Choose a standard"
              : "Other standards for organisations"}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="bg-white border border-slate-200 rounded-lg p-6 hover:border-teal-300 hover:shadow-sm transition-all"
              >
                <div className="text-lg font-bold text-slate-900 mb-1">
                  {item.code}
                </div>
                <div className="text-sm text-slate-500 mb-3" style={sans}>
                  {item.name}
                </div>
                <span
                  className="inline-flex items-center gap-1 text-sm text-teal-600 font-medium"
                  style={sans}
                >
                  Read the guide <ArrowRight size={14} aria-hidden="true" />
                </span>
              </Link>
            ))}
            {page.kind === "standard" && (
              <Link
                href={UGANDA_ISO_HUB_PATH}
                className="bg-white border border-slate-200 rounded-lg p-6 hover:border-teal-300 hover:shadow-sm transition-all"
              >
                <div className="text-lg font-bold text-slate-900 mb-1">
                  All standards
                </div>
                <div className="text-sm text-slate-500 mb-3" style={sans}>
                  ISO certification in Uganda
                </div>
                <span
                  className="inline-flex items-center gap-1 text-sm text-teal-600 font-medium"
                  style={sans}
                >
                  Back to the hub <ArrowRight size={14} aria-hidden="true" />
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            Questions organisations ask
          </h2>
          <div className="space-y-4">
            {page.faqs.map((faq) => (
              <div
                key={faq.q}
                className="bg-slate-50 border border-slate-200 rounded-lg p-6"
              >
                <h3 className="font-bold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-600 leading-relaxed" style={sans}>
                  <RichText text={faq.a} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: "#f0fdfa" }}>
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="flex items-center gap-2 mb-4" style={{ color: "#0f766e" }}>
            <ShieldCheck size={18} aria-hidden="true" />
            <p className="text-xs font-medium uppercase tracking-wide" style={sans}>
              Next step for your organisation
            </p>
          </div>
          <p className="text-slate-700 leading-relaxed mb-8" style={sans}>
            <RichText text={page.closing} />
          </p>
          <a
            href={page.gapAnalysisHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-md font-medium transition-colors hover:bg-teal-700"
            style={{ backgroundColor: "#0d9488", ...sans }}
          >
            Book a free ISO gap analysis <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
