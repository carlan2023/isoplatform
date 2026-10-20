import type { ReactNode } from "react";
import Footer from "@/app/components/Footer";
import SiteNav from "@/app/components/SiteNav";
import {
  CERTIFICATE_DISCLAIMER,
  VERIFY_PAGE_DESCRIPTION,
  VERIFY_PAGE_TITLE,
} from "@/lib/certificates";

const sans = { fontFamily: "var(--font-geist-sans), sans-serif" } as const;

export default function VerifyShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50" style={{ fontFamily: "'Georgia', serif" }}>
      <SiteNav />
      <section className="max-w-3xl mx-auto px-5 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-medium text-teal-700 mb-3" style={sans}>
          NAM QMS training
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
          {VERIFY_PAGE_TITLE}
        </h1>
        <p className="text-slate-600 leading-relaxed mb-8" style={sans}>
          {VERIFY_PAGE_DESCRIPTION} A surname is optional and is used only as an extra check.
        </p>
        {children}
        <p className="text-sm text-slate-500 leading-relaxed mt-8" style={sans}>
          {CERTIFICATE_DISCLAIMER}
        </p>
      </section>
      <Footer />
    </main>
  );
}
