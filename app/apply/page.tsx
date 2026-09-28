import type { Metadata } from "next";
import { ClipboardList, FileText, MessageCircle, Rocket } from "lucide-react";
import ApplicationForm from "@/app/components/ApplicationForm";
import Footer from "@/app/components/Footer";
import SiteNav from "@/app/components/SiteNav";
import { APPLICATION_OPTIONS, standardFromSlug } from "@/lib/application";
import { CONTACT, SITE_NAME, abs } from "@/lib/site";
import { OG_IMAGE } from "@/lib/media";

const TITLE = "Apply for ISO Certification";
const DESCRIPTION =
  "Apply for ISO 9001, 14001, 45001, 22000, 27001, 27701 or PCI DSS certification support. Tell us about your organisation and we'll send a tailored quotation within 2 business days.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: abs("/apply") },
  openGraph: {
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: abs("/apply"),
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
};

const sans = { fontFamily: "system-ui, sans-serif" } as const;

const STEPS = [
  {
    icon: ClipboardList,
    title: "Submit your application",
    desc: "Tell us about your organisation, the standards you need and your scope. It takes about 5 minutes.",
  },
  {
    icon: FileText,
    title: "We review & send a quotation",
    desc: "Our team reviews your details and sends a tailored quotation — typically within 2 business days.",
  },
  {
    icon: Rocket,
    title: "Kick-off",
    desc: "Once you accept, we agree a plan and timeline and start your certification project.",
  },
];

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.standard) ? params.standard[0] : params.standard;
  const defaultStandard = standardFromSlug(raw);

  return (
    <main className="min-h-screen bg-slate-50" style={{ fontFamily: "'Georgia', serif" }}>
      <SiteNav />

      {/* INTRO */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "#0d9488", ...sans }}
          >
            ISO certification application
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
            Apply for ISO certification
          </h1>
          <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-2xl" style={sans}>
            Share a few details about your organisation and what you need
            certified. We&apos;ll use them to prepare an accurate, no-obligation
            quotation for consulting, auditing or training.
          </p>
        </div>
      </section>

      {/* BODY */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 grid gap-8 lg:grid-cols-3 lg:gap-10">
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-8 shadow-sm">
            <ApplicationForm
              options={APPLICATION_OPTIONS}
              defaultStandard={defaultStandard}
              whatsappUrl={CONTACT.whatsapp}
              whatsappDisplay={CONTACT.phoneDisplay}
            />
          </div>
        </div>

        <aside className="order-1 lg:order-2 space-y-6 lg:sticky lg:top-6 self-start">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-5">What happens next</h2>
            <ol className="space-y-5">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: "#f0fdfa", color: "#0f766e" }}
                    aria-hidden="true"
                  >
                    <step.icon size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm" style={sans}>
                      <span className="sr-only">Step {i + 1}: </span>
                      {step.title}
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed mt-0.5" style={sans}>
                      {step.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl p-6 border border-teal-200 bg-teal-50" style={sans}>
            <p className="text-sm text-teal-900 font-semibold mb-1">Prefer to talk first?</p>
            <p className="text-sm text-teal-800 mb-3">
              Chat with our team on WhatsApp — we&apos;re happy to help you
              work out your scope.
            </p>
            <a
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-teal-800 hover:text-teal-900 underline"
            >
              <MessageCircle size={16} aria-hidden="true" /> {CONTACT.phoneDisplay}
            </a>
          </div>
        </aside>
      </section>

      <Footer />
    </main>
  );
}
