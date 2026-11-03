import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  MessageCircle,
  User,
  Users,
} from "lucide-react";
import Footer from "@/app/components/Footer";
import SiteNav from "@/app/components/SiteNav";
import { IMG, OG_IMAGE } from "@/lib/media";
import {
  PECB_AUDIENCE,
  PECB_FAQS,
  PECB_HEADING,
  PECB_INCLUDED,
  PECB_INTRO,
  PECB_META_DESCRIPTION,
  PECB_META_TITLE,
  PECB_QUOTE_LEAD,
  PECB_STEPS,
  PECB_TRADEMARK_NOTICE,
  PECB_TRAINING_PATH,
  pecbPageJsonLd,
} from "@/lib/pecb";
import { jsonLdHtml } from "@/lib/seo";
import { CONTACT, SITE_NAME, abs } from "@/lib/site";

const QUOTE_MAILTO = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
  "PECB Training – Quote Request",
)}`;
const WHATSAPP_QUOTE = `${CONTACT.whatsapp}?text=${encodeURIComponent(
  "Hi NAM QMS, we'd like a quote for PECB training",
)}`;

const sans = { fontFamily: "system-ui, sans-serif" } as const;

const AUDIENCE_ICONS = [User, Users, Building2] as const;

export const metadata: Metadata = {
  title: { absolute: PECB_META_TITLE },
  description: PECB_META_DESCRIPTION,
  alternates: { canonical: PECB_TRAINING_PATH },
  openGraph: {
    title: PECB_META_TITLE,
    description: PECB_META_DESCRIPTION,
    url: abs(PECB_TRAINING_PATH),
    siteName: SITE_NAME,
    type: "website",
    images: [
      {
        url: OG_IMAGE.src,
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        alt: OG_IMAGE.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PECB_META_TITLE,
    description: PECB_META_DESCRIPTION,
    images: [OG_IMAGE.src],
  },
};

function QuoteButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={QUOTE_MAILTO}
      className={`inline-flex items-center justify-center gap-2 text-white px-6 py-3 rounded-md font-medium transition-colors hover:bg-teal-700 ${className}`}
      style={{ backgroundColor: "#0d9488", ...sans }}
    >
      Request a quote <ArrowRight size={16} aria-hidden="true" />
    </a>
  );
}

function WhatsAppButton({ onDark = false }: { onDark?: boolean }) {
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
      Request a quote on WhatsApp
    </a>
  );
}

export default function PecbTrainingPage() {
  const { service, faq, breadcrumb } = pecbPageJsonLd();

  return (
    <main
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Georgia', serif" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(service) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(faq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumb) }}
      />

      <SiteNav />

      <section style={{ backgroundColor: "#ccfbf1" }}>
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-24 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <p
              className="text-sm font-medium mb-4"
              style={{ color: "#0f766e", ...sans }}
            >
              PECB partner · Authorized Training Reseller
            </p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-slate-900">
              {PECB_HEADING}
            </h1>
            <p
              className="text-slate-600 text-lg leading-relaxed mb-8"
              style={sans}
            >
              {PECB_INTRO}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <QuoteButton />
              <WhatsAppButton />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-teal-100 shadow-sm bg-white aspect-[4/3]">
            <Image
              src={IMG.pecbClassroom.src}
              alt={IMG.pecbClassroom.alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: "#0f172a" }}>
        <div className="max-w-4xl mx-auto px-6 py-10 text-center">
          <p
            className="text-sm md:text-base leading-relaxed"
            style={{ color: "#ccfbf1", ...sans }}
          >
            PECB partner · Classroom in Kampala and live online · Pricing by
            quote
          </p>
        </div>
      </section>

      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-10">
            What&apos;s included
          </h2>
          <ul className="grid md:grid-cols-2 gap-4">
            {PECB_INCLUDED.map((item) => (
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
                <span
                  className="text-sm text-slate-700 leading-relaxed"
                  style={sans}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="border-b border-slate-100"
        style={{ backgroundColor: "#f8fafc" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-10">
            How it works
          </h2>
          <ol className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PECB_STEPS.map((step) => (
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
                <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                <p
                  className="text-sm text-slate-700 leading-relaxed"
                  style={sans}
                >
                  {step.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-10">
            Who it&apos;s for
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PECB_AUDIENCE.map((item, index) => {
              const Icon = AUDIENCE_ICONS[index] ?? Users;
              return (
                <article
                  key={item.title}
                  className="border border-slate-200 rounded-lg p-6 bg-white"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: "#ccfbf1" }}
                  >
                    <Icon
                      size={20}
                      style={{ color: "#0f766e" }}
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p
                    className="text-sm text-slate-500 leading-relaxed"
                    style={sans}
                  >
                    {item.desc}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {PECB_FAQS.map((item) => (
              <details
                key={item.q}
                className="group border border-slate-200 rounded-lg bg-slate-50"
              >
                <summary
                  className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-bold text-slate-900 [&::-webkit-details-marker]:hidden"
                >
                  <span>{item.q}</span>
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
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section
        id="quote"
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
            Request a quote
          </h2>
          <p
            className="text-base leading-relaxed mb-8"
            style={{ color: "#ccfbf1", ...sans }}
          >
            {PECB_QUOTE_LEAD}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <QuoteButton />
            <WhatsAppButton onDark />
          </div>
          <p className="mt-8 text-sm" style={{ color: "#ccfbf1", ...sans }}>
            <a
              href={QUOTE_MAILTO}
              className="underline underline-offset-4 hover:opacity-80"
            >
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

      <section className="bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <p className="text-xs leading-relaxed text-slate-500" style={sans}>
            {PECB_TRADEMARK_NOTICE}
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
