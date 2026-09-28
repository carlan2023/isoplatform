"use client";

// Last-resort error boundary for failures in the root layout itself. It
// replaces the whole document, so it must render its own <html>/<body> and
// can't rely on globals.css — styles are inline.

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error boundary]", error);
  }, [error]);

  const font = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          background: "#f8fafc",
          color: "#0f172a",
          fontFamily: font,
        }}
      >
        <main
          role="alert"
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 32,
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 24px" }}>
            NAM Quality Management Systems is having trouble loading. Please try
            again, or message us on WhatsApp.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              display: "block",
              width: "100%",
              background: "#0d9488",
              color: "#fff",
              border: 0,
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: font,
            }}
          >
            Try again
          </button>
          {/* A plain <a> on purpose: the router may be what failed. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              display: "block",
              marginTop: 12,
              color: "#334155",
              fontSize: 14,
            }}
          >
            Go to the homepage
          </a>
          <a
            href="https://wa.me/256707068533"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              marginTop: 12,
              color: "#0d9488",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Message us on WhatsApp
          </a>
          {error.digest && (
            <p style={{ marginTop: 20, fontSize: 12, color: "#94a3b8" }}>
              Error reference: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
