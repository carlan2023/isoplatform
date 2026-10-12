"use client";

import { useEffect, useId, useState } from "react";
import { CheckCircle2, Loader2, Smartphone, XCircle } from "lucide-react";
import {
  GROUP_HONEYPOT_FIELD,
  INTERNAL_AUDITOR_COURSE_TITLE,
} from "@/lib/group-enrollment";
import { normalizeUgandaMobile } from "@/lib/phone";
import {
  computePricing,
  formatUGX,
  INTERNAL_AUDITOR_GROUP_MIN,
  INTERNAL_AUDITOR_GROUP_PRICE,
  INTERNAL_AUDITOR_PRICE,
  MAX_TEAM_SIZE,
} from "@/lib/pricing";
import { CONTACT } from "@/lib/site";
import { isUuid, isValidEmail } from "@/lib/validation";

type Step = "form" | "pending" | "confirmed" | "failed" | "accepted";

type Participant = { name: string; email: string };

const sans = { fontFamily: "system-ui, sans-serif" } as const;
const STATUS_POLL_MS = 5_000;
const STATUS_POLL_MAX_MS = 15 * 60 * 1000;

const inputCls =
  "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30";

function blankParticipants(count: number, current: Participant[]): Participant[] {
  if (count === current.length) return current;
  if (count < current.length) return current.slice(0, count);
  return [
    ...current,
    ...Array.from({ length: count - current.length }, () => ({ name: "", email: "" })),
  ];
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    const data = await res.json();
    return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export default function InternalAuditorEnrollForm() {
  const honeypotId = useId();
  const totalId = useId();
  const [step, setStep] = useState<Step>("form");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [momoPhone, setMomoPhone] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([
    { name: "", email: "" },
  ]);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [reference, setReference] = useState("");
  const [paidAmount, setPaidAmount] = useState<number | null>(null);

  const team = participants.length;
  const { perPerson, fullAmount } = computePricing(team, "internal-auditor");
  const groupRate = team >= INTERNAL_AUDITOR_GROUP_MIN;
  const normalizedPhone = normalizeUgandaMobile(momoPhone);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("enrollment");
    if (id && isUuid(id)) {
      setEnrollmentId(id);
      setStep("pending");
    }
  }, []);

  useEffect(() => {
    if (step !== "pending" || !enrollmentId) return;
    const startedAt = Date.now();
    let stopped = false;

    const poll = async () => {
      if (stopped || Date.now() - startedAt > STATUS_POLL_MAX_MS) return;
      try {
        const res = await fetch(
          `/api/internal-auditor-courses/status?id=${encodeURIComponent(enrollmentId)}`,
          { cache: "no-store" },
        );
        const data = await readJson(res);
        if (stopped || !res.ok) return;
        if (typeof data.amount === "number") setPaidAmount(data.amount);
        if (data.status === "confirmed") {
          stopped = true;
          setStep("confirmed");
        } else if (data.status === "cancelled") {
          stopped = true;
          setStep("failed");
        }
      } catch {
        // Try again on the next tick.
      }
    };

    const timer = setInterval(poll, STATUS_POLL_MS);
    void poll();
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [step, enrollmentId]);

  const setTeamSize = (next: number) => {
    const size = Math.min(MAX_TEAM_SIZE, Math.max(1, next));
    setParticipants((current) => blankParticipants(size, current));
  };

  const updateParticipant = (index: number, field: keyof Participant, value: string) => {
    setParticipants((current) =>
      current.map((person, i) => (i === index ? { ...person, [field]: value } : person)),
    );
  };

  const clientError = (): string | null => {
    if (!companyName.trim()) return "Enter your company name.";
    if (!contactName.trim()) return "Enter your name.";
    if (!isValidEmail(contactEmail.trim())) {
      return "Enter a valid email address for the confirmation.";
    }
    if (!normalizedPhone) {
      return "Enter a valid MTN or Airtel Uganda number, e.g. 0771234567 or +256771234567.";
    }
    const seen = new Set<string>();
    for (let i = 0; i < participants.length; i += 1) {
      const person = participants[i];
      if (!person.name.trim()) return `Enter a name for participant ${i + 1}.`;
      const email = person.email.trim().toLowerCase();
      if (!isValidEmail(email)) return `Enter a valid email for participant ${i + 1}.`;
      if (seen.has(email)) return "Each participant needs their own email address.";
      seen.add(email);
    }
    return null;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const problem = clientError();
    if (problem) {
      setErrorMsg(problem);
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/internal-auditor-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactName,
          contactEmail,
          momoPhone,
          teamSize: team,
          fullAmount,
          participants: participants.map((person) => ({
            name: person.name,
            email: person.email,
          })),
          [GROUP_HONEYPOT_FIELD]: honeypot,
        }),
      });
      const data = await readJson(res);
      if (!res.ok || data.success !== true) {
        setErrorMsg(
          typeof data.error === "string"
            ? data.error
            : "We couldn't start the Mobile Money payment. Please try again.",
        );
        if (typeof data.reference === "string") setReference(data.reference);
        return;
      }
      if (typeof data.id !== "string") {
        setStep("accepted");
        return;
      }
      setEnrollmentId(data.id);
      setReference(typeof data.reference === "string" ? data.reference : "");
      setPaidAmount(typeof data.amount === "number" ? data.amount : fullAmount);
      const url = new URL(window.location.href);
      url.searchParams.set("enrollment", data.id);
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
      setStep("pending");
    } catch {
      setErrorMsg("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setErrorMsg("");
    setReference("");
    setEnrollmentId("");
    setPaidAmount(null);
    setStep("form");
    const url = new URL(window.location.href);
    url.searchParams.delete("enrollment");
    window.history.replaceState(null, "", url.pathname);
  };

  if (step === "pending") {
    return (
      <div className="text-center py-6" role="status">
        <Smartphone size={40} className="mx-auto mb-4 text-teal-600" aria-hidden="true" />
        <h2 className="font-bold text-slate-900 text-xl mb-2">Check your phone</h2>
        <p className="text-slate-600 text-sm mb-4" style={sans}>
          Approve the Mobile Money prompt
          {paidAmount ? <> for <strong>{formatUGX(paidAmount)}</strong></> : null}
          {normalizedPhone ? <> on <strong>{normalizedPhone}</strong></> : null}.
          Your seats are confirmed once the payment goes through.
        </p>
        {reference && (
          <p className="text-sm text-slate-500 mb-4" style={sans}>
            Reference <strong className="text-slate-800">{reference}</strong>
          </p>
        )}
        <p className="text-xs text-slate-400" style={sans}>
          This page updates when NAM QMS receives the payment. You can leave it open.
        </p>
      </div>
    );
  }

  if (step === "confirmed") {
    return (
      <div className="text-center py-6" role="status">
        <CheckCircle2 size={40} className="mx-auto mb-4 text-teal-600" aria-hidden="true" />
        <h2 className="font-bold text-slate-900 text-xl mb-2">Payment received</h2>
        <p className="text-slate-600 text-sm" style={sans}>
          {companyName ? <strong>{companyName}</strong> : "Your team"} is enrolled in{" "}
          {INTERNAL_AUDITOR_COURSE_TITLE}
          {paidAmount ? <> · {formatUGX(paidAmount)} paid</> : null}. We&apos;ll email joining
          details{contactEmail ? <> to <strong>{contactEmail}</strong></> : null}.
        </p>
        {reference && (
          <p className="text-sm text-slate-500 mt-4" style={sans}>
            Reference <strong className="text-slate-800">{reference}</strong>
          </p>
        )}
      </div>
    );
  }

  if (step === "accepted") {
    return (
      <div className="text-center py-6" role="status">
        <CheckCircle2 size={40} className="mx-auto mb-4 text-teal-600" aria-hidden="true" />
        <h2 className="font-bold text-slate-900 text-xl mb-2">Request received</h2>
        <p className="text-slate-600 text-sm" style={sans}>
          Thank you. NAM QMS will follow up if anything else is needed.
        </p>
      </div>
    );
  }

  if (step === "failed") {
    return (
      <div className="text-center py-6" role="alert">
        <XCircle size={40} className="mx-auto mb-4 text-red-500" aria-hidden="true" />
        <h2 className="font-bold text-slate-900 text-xl mb-2">Payment didn&apos;t go through</h2>
        <p className="text-slate-600 text-sm mb-6" style={sans}>
          The Mobile Money payment was declined, cancelled or timed out, so no money was taken.
          You can try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="w-full text-white text-sm font-semibold py-3 rounded-lg"
          style={{ backgroundColor: "#0d9488", ...sans }}
        >
          Try again
        </button>
        <a
          href={CONTACT.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-semibold underline"
          style={{ color: "#0d9488", ...sans }}
        >
          Need help? Message us on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-8" aria-label="Internal Auditor Courses enrollment">
      {errorMsg && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3" style={sans}>
          <p>{errorMsg}</p>
          {reference && <p className="mt-1">Payment reference: {reference}</p>}
        </div>
      )}

      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor={honeypotId}>Leave this field empty</label>
        <input
          id={honeypotId}
          name={GROUP_HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <fieldset className="space-y-4">
        <legend className="text-lg font-bold text-slate-900 mb-1">Company</legend>
        <p className="text-sm text-slate-500" style={sans}>
          Fields marked <span className="text-teal-700">*</span> are required.
        </p>
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1.5" style={sans}>
            Company name <span className="text-teal-700">*</span>
          </label>
          <input
            id="companyName"
            name="companyName"
            className={inputCls}
            style={sans}
            autoComplete="organization"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-slate-700 mb-1.5" style={sans}>
              Your name <span className="text-teal-700">*</span>
            </label>
            <input
              id="contactName"
              name="contactName"
              className={inputCls}
              style={sans}
              autoComplete="name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-700 mb-1.5" style={sans}>
              Your email <span className="text-teal-700">*</span>
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              className={inputCls}
              style={sans}
              autoComplete="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="momoPhone" className="block text-sm font-medium text-slate-700 mb-1.5" style={sans}>
            Mobile Money number <span className="text-teal-700">*</span>
          </label>
          <input
            id="momoPhone"
            name="momoPhone"
            type="tel"
            inputMode="tel"
            className={inputCls}
            style={sans}
            autoComplete="tel"
            placeholder="0771234567"
            value={momoPhone}
            onChange={(e) => setMomoPhone(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-slate-500" style={sans}>
            MTN or Airtel Uganda. The prompt for {formatUGX(fullAmount)} is sent to this number.
          </p>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-bold text-slate-900">Participants</legend>
        <div>
          <label htmlFor="teamSize" className="block text-sm font-medium text-slate-700 mb-1.5" style={sans}>
            Number of participants <span className="text-teal-700">*</span>
          </label>
          <select
            id="teamSize"
            name="teamSize"
            className={inputCls}
            style={sans}
            value={team}
            aria-describedby={totalId}
            onChange={(e) => setTeamSize(Number(e.target.value))}
          >
            {Array.from({ length: MAX_TEAM_SIZE }, (_, i) => i + 1).map((n) => {
              const price = computePricing(n, "internal-auditor");
              return (
                <option key={n} value={n}>
                  {n} — {formatUGX(price.fullAmount)} total
                  {n >= INTERNAL_AUDITOR_GROUP_MIN ? " (50% off)" : ""}
                </option>
              );
            })}
          </select>
          <p className="mt-1 text-xs text-slate-500" style={sans}>
            {formatUGX(INTERNAL_AUDITOR_PRICE)} per person. Groups of {INTERNAL_AUDITOR_GROUP_MIN} or
            more pay {formatUGX(INTERNAL_AUDITOR_GROUP_PRICE)} per person. Teams larger than{" "}
            {MAX_TEAM_SIZE}:{" "}
            <a
              className="underline"
              style={{ color: "#0f766e" }}
              href={`mailto:${CONTACT.email}?subject=${encodeURIComponent("Internal Auditor Courses — larger group")}`}
            >
              email {CONTACT.email}
            </a>
            .
          </p>
        </div>

        <ol className="space-y-4">
          {participants.map((person, index) => (
            <li key={index} className="border border-slate-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-slate-800 mb-3" style={sans}>
                Participant {index + 1}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`participant-name-${index}`}
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                    style={sans}
                  >
                    Name <span className="text-teal-700">*</span>
                  </label>
                  <input
                    id={`participant-name-${index}`}
                    className={inputCls}
                    style={sans}
                    autoComplete="name"
                    value={person.name}
                    onChange={(e) => updateParticipant(index, "name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor={`participant-email-${index}`}
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                    style={sans}
                  >
                    Email <span className="text-teal-700">*</span>
                  </label>
                  <input
                    id={`participant-email-${index}`}
                    type="email"
                    className={inputCls}
                    style={sans}
                    autoComplete="off"
                    value={person.email}
                    onChange={(e) => updateParticipant(index, "email", e.target.value)}
                    required
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </fieldset>

      <div className="rounded-xl border border-teal-200 bg-teal-50 p-5" id={totalId}>
        <p className="text-sm text-teal-900" style={sans}>
          {groupRate
            ? `Group rate applied: 50% off, ${formatUGX(perPerson)} per person.`
            : `${formatUGX(perPerson)} per person. Add ${INTERNAL_AUDITOR_GROUP_MIN - team} more for 50% off.`}
        </p>
        <p className="mt-2 text-slate-900" aria-live="polite" aria-atomic="true">
          <span className="text-sm text-slate-600" style={sans}>
            {team} × {formatUGX(perPerson)} =
          </span>{" "}
          <strong className="text-2xl">{formatUGX(fullAmount)}</strong>
        </p>
        <p className="mt-1 text-xs text-slate-500" style={sans}>
          Total due now, in whole Uganda shillings, by MTN or Airtel Mobile Money.
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 text-white text-sm font-semibold py-3 rounded-lg disabled:opacity-60"
        style={{ backgroundColor: "#0d9488", ...sans }}
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Sending payment prompt…
          </>
        ) : (
          `Pay ${formatUGX(fullAmount)} with Mobile Money`
        )}
      </button>
    </form>
  );
}
