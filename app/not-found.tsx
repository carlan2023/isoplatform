import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";
import SiteNav from "@/app/components/SiteNav";
import Footer from "@/app/components/Footer";
import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

const sans = { fontFamily: "system-ui, sans-serif" } as const;

export default function NotFound() {
  return (
    <main
      className="min-h-screen bg-white flex flex-col"
      style={{ fontFamily: "'Georgia', serif" }}
    >
      <SiteNav />

      <section className="flex-1 flex items-center">
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <div
            className="mx-auto mb-6 w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#f0fdfa" }}
          >
            <SearchX size={26} className="text-teal-600" aria-hidden="true" />
          </div>
          <p
            className="text-sm font-medium text-teal-700 mb-2"
            style={sans}
          >
            Error 404
          </p>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            We couldn&apos;t find that page
          </h1>
          <p className="text-slate-500 leading-relaxed mb-10" style={sans}>
            The link may be broken or the page may have moved. Here are a few
            places to pick up from.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-md font-medium transition-colors hover:bg-teal-700"
              style={{ backgroundColor: "#0d9488", ...sans }}
            >
              Apply for certification <ArrowRight size={16} />
            </Link>
            <Link
              href="/iso-certification-consulting"
              className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-6 py-3 rounded-md font-medium transition-colors hover:border-teal-300 hover:text-teal-700"
              style={sans}
            >
              ISO certification consulting
            </Link>
          </div>
          <p className="text-sm text-slate-500 mt-8" style={sans}>
            <Link href="/" className="text-teal-600 hover:underline font-medium">
              Back to the home page
            </Link>{" "}
            or{" "}
            <a
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:underline font-medium"
            >
              ask us on WhatsApp
            </a>
            .
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
