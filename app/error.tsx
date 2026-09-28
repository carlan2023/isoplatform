"use client";

// Route-level error boundary: catches errors thrown while rendering any page
// below the root layout, so the visitor sees a branded recovery screen instead
// of a blank page. The error details are logged, never shown.

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

const WHATSAPP = "https://wa.me/256707068533";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  const sans = { fontFamily: "system-ui, sans-serif" };

  return (
    <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center px-4 py-16">
      <div
        role="alert"
        className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 max-w-md w-full text-center shadow-sm"
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: "#f0fdfa" }}
        >
          <AlertTriangle size={26} style={{ color: "#0d9488" }} aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-slate-500 text-sm mb-8" style={sans}>
          Sorry — this page hit an unexpected problem. Please try again. If it
          keeps happening, message us on WhatsApp and we&apos;ll help you
          directly.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: "#0d9488", ...sans }}
          >
            <RotateCcw size={15} aria-hidden="true" /> Try again
          </button>
          <Link
            href="/"
            className="inline-block border border-slate-200 text-slate-700 text-sm font-medium px-6 py-3 rounded-lg transition-colors hover:bg-slate-50"
            style={sans}
          >
            Go to the homepage
          </Link>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold underline"
            style={{ color: "#0d9488", ...sans }}
          >
            Message us on WhatsApp
          </a>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-slate-400" style={sans}>
            Error reference: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  );
}
