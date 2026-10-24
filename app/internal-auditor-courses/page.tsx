import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/app/components/Footer";
import InternalAuditorEnrollForm from "@/app/components/InternalAuditorEnrollForm";
import SiteNav from "@/app/components/SiteNav";
import { INTERNAL_AUDITOR_ENROLL_PATH } from "@/lib/group-enrollment";
import { OG_IMAGE } from "@/lib/media";
import {
  formatUGX,
  INTERNAL_AUDITOR_GROUP_MIN,
  INTERNAL_AUDITOR_GROUP_PRICE,
  INTERNAL_AUDITOR_PRICE,
} from "@/lib/pricing";
import { abs, SITE_NAME } from "@/lib/site";

const TITLE = "Internal Auditor Course for Individuals";
const DESCRIPTION = `Internal auditor course for individuals from NAM QMS. ${formatUGX(INTERNAL_AUDITOR_PRICE)} per person, or ${formatUGX(INTERNAL_AUDITOR_GROUP_PRICE)} per person for groups of ${INTERNAL_AUDITOR_GROUP_MIN} or more. Pay the total with Mobile Money.`;

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | NAM QMS` },
  description: DESCRIPTION,
  alternates: { canonical: abs(INTERNAL_AUDITOR_ENROLL_PATH) },
  openGraph: {
    title: `${TITLE} | NAM QMS`,
    description: DESCRIPTION,
    url: abs(INTERNAL_AUDITOR_ENROLL_PATH),
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

export default function InternalAuditorCoursesPage() {
  return (
    <main className="min-h-screen bg-slate-50" style={{ fontFamily: "'Georgia', serif" }}>
      <SiteNav />

      <section className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "#0d9488", ...sans }}
          >
            NAM QMS · Training for individuals
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
            {TITLE}
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed" style={sans}>
            Training is for individuals. {formatUGX(INTERNAL_AUDITOR_PRICE)} per
            person. Groups of {INTERNAL_AUDITOR_GROUP_MIN} or more get 50% off —{" "}
            {formatUGX(INTERNAL_AUDITOR_GROUP_PRICE)} per person. Enter each
            participant, see the total, and pay it with MTN or Airtel Mobile
            Money.
          </p>
          <p className="text-sm text-slate-600 mt-4" style={sans}>
            Implementation is for organisations and is quoted. See{" "}
            <Link
              href="/internal-audit-training"
              className="font-medium underline underline-offset-2"
              style={{ color: "#0f766e" }}
            >
              internal audit implementation for organisations
            </Link>
            .
          </p>
        </div>
      </section>

      <section id="enroll" className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-8 shadow-sm">
          <InternalAuditorEnrollForm />
        </div>
      </section>

      <Footer />
    </main>
  );
}
