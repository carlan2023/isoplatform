import { CheckCircle2, CircleOff, SearchX, ShieldAlert, TimerReset } from "lucide-react";
import {
  formatCertificateDate,
  type PublicLookupOutcome,
} from "@/lib/certificates";

const sans = { fontFamily: "var(--font-geist-sans), sans-serif" } as const;

export default function CertificateLookupResult({
  outcome,
}: {
  outcome: PublicLookupOutcome;
}) {
  if (outcome.kind === "found") {
    const certificate = outcome.certificate;
    const valid = certificate.status === "valid";
    return (
      <section
        aria-live="polite"
        className={`mt-6 rounded-xl border p-5 sm:p-6 ${
          valid ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        }`}
        style={sans}
      >
        <div className="flex items-center gap-2 mb-4">
          {valid ? (
            <CheckCircle2 className="text-green-700" size={22} aria-hidden="true" />
          ) : (
            <CircleOff className="text-red-700" size={22} aria-hidden="true" />
          )}
          <h2 className={`text-xl font-bold ${valid ? "text-green-800" : "text-red-800"}`}>
            {valid ? "Valid" : "Revoked"}
          </h2>
        </div>
        <p className={`text-sm mb-5 ${valid ? "text-green-900" : "text-red-900"}`}>
          {valid
            ? "This NAM QMS certificate of completion is valid."
            : "This NAM QMS certificate of completion has been revoked. It is no longer valid."}
        </p>
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <Detail label="Certificate ID" value={certificate.certificateId} mono />
          <Detail label="Holder" value={certificate.holderName} />
          <Detail label="Course" value={certificate.course} />
          <Detail
            label="Training"
            value={`${formatCertificateDate(certificate.trainingStart)} to ${formatCertificateDate(certificate.trainingEnd)}`}
          />
          <Detail label="Issued" value={formatCertificateDate(certificate.issueDate)} />
          <Detail label="Status" value={valid ? "Valid" : "Revoked"} />
        </dl>
      </section>
    );
  }

  const empty = {
    invalid_id: {
      icon: <SearchX className="text-slate-500" size={22} aria-hidden="true" />,
      title: "Check the certificate ID",
      body: "Certificate IDs look like NAMQMS-2026-LA-0001.",
    },
    not_found: {
      icon: <SearchX className="text-slate-500" size={22} aria-hidden="true" />,
      title: "No certificate found",
      body: "No NAM QMS certificate of completion matches that ID. Check the characters and try again.",
    },
    rate_limited: {
      icon: <TimerReset className="text-amber-700" size={22} aria-hidden="true" />,
      title: "Too many checks",
      body: "Please wait a few minutes and try again.",
    },
    unavailable: {
      icon: <ShieldAlert className="text-amber-700" size={22} aria-hidden="true" />,
      title: "Verification is unavailable",
      body: "Please try again later.",
    },
  }[outcome.kind];

  return (
    <section
      aria-live="polite"
      className="mt-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      style={sans}
    >
      <div className="flex items-center gap-2 mb-2">
        {empty.icon}
        <h2 className="text-xl font-bold text-slate-900">{empty.title}</h2>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{empty.body}</p>
      {outcome.kind === "not_found" && (
        <p className="text-sm text-slate-500 mt-3 font-mono">{outcome.certificateId}</p>
      )}
    </section>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`mt-1 text-slate-900 font-medium ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
