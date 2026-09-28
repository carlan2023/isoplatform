"use client";

import {
  useRef,
  useState,
  useSyncExternalStore,
  useEffect,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
// Type-only imports: lib/application pulls in the Resend SDK, so its runtime
// values (option lists) arrive as props from the server page instead.
import type { ApplicationOptions } from "@/lib/application";

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

type FormState = {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  legalName: string;
  tradingName: string;
  address: string;
  city: string;
  country: string;
  website: string;
  industry: string;
  registrationNumber: string;
  standards: string[];
  otherStandard: string;
  scope: string;
  siteCount: string;
  siteAddresses: string;
  outsourcedProcesses: string;
  totalEmployees: string;
  fullTimeEmployees: string;
  partTimeEmployees: string;
  shifts: string;
  serviceNeeded: string;
  certificationType: string;
  currentStatus: string;
  currentCertificationBody: string;
  targetDate: string;
  referralSource: string;
  notes: string;
  consent: boolean;
};

type TextField = Exclude<keyof FormState, "standards" | "consent">;
type Errors = Partial<Record<keyof FormState | "form", string>>;

const EMPTY: FormState = {
  fullName: "",
  jobTitle: "",
  email: "",
  phone: "",
  legalName: "",
  tradingName: "",
  address: "",
  city: "",
  country: "Uganda",
  website: "",
  industry: "",
  registrationNumber: "",
  standards: [],
  otherStandard: "",
  scope: "",
  siteCount: "1",
  siteAddresses: "",
  outsourcedProcesses: "",
  totalEmployees: "",
  fullTimeEmployees: "",
  partTimeEmployees: "",
  shifts: "1",
  serviceNeeded: "",
  certificationType: "",
  currentStatus: "",
  currentCertificationBody: "",
  targetDate: "",
  referralSource: "",
  notes: "",
  consent: false,
};

/** Order used to find the first invalid field to focus. */
const FIELD_ORDER: (keyof FormState)[] = [
  "fullName",
  "jobTitle",
  "email",
  "phone",
  "legalName",
  "tradingName",
  "address",
  "city",
  "country",
  "website",
  "industry",
  "registrationNumber",
  "standards",
  "otherStandard",
  "scope",
  "siteCount",
  "siteAddresses",
  "outsourcedProcesses",
  "totalEmployees",
  "fullTimeEmployees",
  "partTimeEmployees",
  "shifts",
  "serviceNeeded",
  "certificationType",
  "currentStatus",
  "currentCertificationBody",
  "targetDate",
  "referralSource",
  "notes",
  "consent",
];

const HONEYPOT_FIELD = "website_url_confirm";
const DRAFT_KEY = "nam-iso-application-draft-v1";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

const sans = { fontFamily: "system-ui, sans-serif" } as const;
const TEAL = "#0d9488";

const fieldId = (name: string) => `app-${name}`;
const errorId = (name: string) => `app-${name}-error`;

// ---------------------------------------------------------------------------
// Draft persistence (per-browser convenience; failures are ignored)
// ---------------------------------------------------------------------------

function loadDraft(): Partial<FormState> | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const out: Partial<FormState> = {};
    for (const key of Object.keys(EMPTY) as (keyof FormState)[]) {
      const v = (parsed as Record<string, unknown>)[key];
      if (key === "standards") {
        if (Array.isArray(v)) out.standards = v.filter((s) => typeof s === "string");
      } else if (key === "consent") {
        if (typeof v === "boolean") out.consent = v;
      } else if (typeof v === "string") {
        out[key] = v;
      }
    }
    return out;
  } catch {
    return null;
  }
}

function saveDraft(form: FormState) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  } catch {
    /* storage unavailable — ignore */
  }
}

function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Light client-side checks (the server re-validates everything)
// ---------------------------------------------------------------------------

function isWholeNumber(value: string, min: number): boolean {
  if (!/^\d+$/.test(value.trim())) return false;
  return Number(value) >= min;
}

function clientValidate(f: FormState): Errors {
  const e: Errors = {};
  const req = (k: TextField, msg: string) => {
    if (!f[k].trim()) e[k] = msg;
  };
  req("fullName", "Enter your full name.");
  if (!f.email.trim()) e.email = "Enter your email address.";
  else if (!EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email address.";
  req("phone", "Enter a phone number.");
  req("legalName", "Enter your organisation's legal name.");
  req("address", "Enter your physical address.");
  req("city", "Enter your city or town.");
  req("industry", "Enter your industry or sector.");
  if (f.standards.length === 0) e.standards = "Select at least one standard.";
  if (f.standards.includes("Other") && !f.otherStandard.trim()) {
    e.otherStandard = "Tell us which other standard you need.";
  }
  req("scope", "Describe the scope you want certified.");
  if (!isWholeNumber(f.siteCount, 1)) e.siteCount = "Enter the number of sites (1 or more).";
  if (!isWholeNumber(f.totalEmployees, 1)) {
    e.totalEmployees = "Enter your total number of employees.";
  }
  if (f.fullTimeEmployees.trim() && !isWholeNumber(f.fullTimeEmployees, 0)) {
    e.fullTimeEmployees = "Enter a whole number.";
  }
  if (f.partTimeEmployees.trim() && !isWholeNumber(f.partTimeEmployees, 0)) {
    e.partTimeEmployees = "Enter a whole number.";
  }
  if (f.shifts.trim() && !isWholeNumber(f.shifts, 1)) e.shifts = "Enter 1 or more.";
  if (!f.serviceNeeded) e.serviceNeeded = "Choose the service you need.";
  if (!f.certificationType) e.certificationType = "Choose the certification type.";
  if (!f.currentStatus) e.currentStatus = "Choose your current status.";
  if (!f.consent) e.consent = "Please agree to be contacted about your application.";
  return e;
}

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

const inputClass = (invalid: boolean) =>
  `w-full border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 ${
    invalid ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-teal-500"
  }`;

function FieldShell({
  name,
  label,
  required,
  hint,
  error,
  wide,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label
        htmlFor={fieldId(name)}
        className="block text-sm font-medium text-slate-700 mb-1.5"
        style={sans}
      >
        {label}
        {required ? (
          <span className="text-teal-700" aria-hidden="true">
            {" "}
            *
          </span>
        ) : (
          <span className="text-slate-400 font-normal"> (optional)</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${fieldId(name)}-hint`} className="mt-1 text-xs text-slate-500" style={sans}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId(name)} className="mt-1 text-xs text-red-600" style={sans}>
          {error}
        </p>
      )}
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
      <legend className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-3">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: TEAL, ...sans }}
          aria-hidden="true"
        >
          {n}
        </span>
        <span>
          <span className="sr-only">{n}. </span>
          {title}
        </span>
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Hydration-aware wrapper: server render uses defaults; once on the client we
// remount with any saved draft (avoids a hydration mismatch and setState-in-
// effect).
// ---------------------------------------------------------------------------

const noopSubscribe = () => () => {};

export default function ApplicationForm(props: {
  options: ApplicationOptions;
  defaultStandard?: string | null;
  whatsappUrl: string;
  whatsappDisplay: string;
}) {
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  return <ApplicationFormInner key={hydrated ? "client" : "server"} hydrated={hydrated} {...props} />;
}

type SuccessState = { reference: string; confirmationSent: boolean; email: string };

function ApplicationFormInner({
  options,
  defaultStandard,
  whatsappUrl,
  whatsappDisplay,
  hydrated,
}: {
  options: ApplicationOptions;
  defaultStandard?: string | null;
  whatsappUrl: string;
  whatsappDisplay: string;
  hydrated: boolean;
}) {
  const [form, setForm] = useState<FormState>(() => {
    const draft = hydrated ? loadDraft() : null;
    const base: FormState = { ...EMPTY, ...(draft ?? {}) };
    if (defaultStandard && !base.standards.includes(defaultStandard)) {
      base.standards = [...base.standards, defaultStandard];
    }
    return base;
  });
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<{ message: string; network?: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // Persist the draft as the user types (client only).
  useEffect(() => {
    if (hydrated && !success) saveDraft(form);
  }, [form, hydrated, success]);

  // Move focus to the success panel once it appears.
  useEffect(() => {
    if (success) {
      successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      successRef.current?.focus({ preventScroll: true });
    }
  }, [success]);

  const clearError = (name: keyof FormState) => {
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const onText = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const name = e.target.name as TextField;
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
    clearError(name);
  };

  const toggleStandard = (value: string) => {
    setForm((prev) => ({
      ...prev,
      standards: prev.standards.includes(value)
        ? prev.standards.filter((s) => s !== value)
        : [...prev.standards, value],
    }));
    clearError("standards");
  };

  const focusFirstError = (errs: Errors) => {
    const first = FIELD_ORDER.find((k) => errs[k]);
    if (!first) {
      bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      bannerRef.current?.focus({ preventScroll: true });
      return;
    }
    const id = first === "standards" ? `${fieldId("standards")}-0` : fieldId(first);
    // Wait a frame so aria-invalid / messages are rendered first.
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    });
  };

  const focusBanner = () => {
    requestAnimationFrame(() => {
      bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      bannerRef.current?.focus({ preventScroll: true });
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setBanner(null);

    const clientErrors = clientValidate(form);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setBanner({ message: "Please correct the highlighted fields." });
      focusFirstError(clientErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    let res: Response;
    try {
      res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, [HONEYPOT_FIELD]: honeypot }),
      });
    } catch {
      setSubmitting(false);
      setBanner({
        message:
          "We couldn't reach our server — please check your connection and try again.",
        network: true,
      });
      focusBanner();
      return;
    }

    let payload: {
      success?: boolean;
      reference?: string;
      confirmationSent?: boolean;
      error?: string;
      fieldErrors?: Record<string, string>;
    } = {};
    try {
      payload = await res.json();
    } catch {
      /* non-JSON response */
    }

    setSubmitting(false);

    if (res.ok && payload.success && payload.reference) {
      clearDraft();
      setSuccess({
        reference: payload.reference,
        confirmationSent: payload.confirmationSent !== false,
        email: form.email.trim(),
      });
      return;
    }

    if (res.status === 400 && payload.fieldErrors) {
      const serverErrors = payload.fieldErrors as Errors;
      setErrors(serverErrors);
      setBanner({ message: payload.error || "Please correct the highlighted fields." });
      focusFirstError(serverErrors);
      return;
    }

    setBanner({
      message:
        payload.error ||
        "Something went wrong submitting your application. Please try again.",
      network: true,
    });
    focusBanner();
  };

  // ------------------------------------------------------------------------
  // Success panel
  // ------------------------------------------------------------------------
  if (success) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="bg-teal-50 border border-teal-200 rounded-xl p-6 sm:p-8 focus:outline-none"
      >
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="text-teal-600 shrink-0" size={28} aria-hidden="true" />
          <h2 className="text-2xl font-bold text-slate-900">Application received</h2>
        </div>
        <p className="text-slate-600 mb-4" style={sans}>
          Thank you. Your reference number is{" "}
          <strong className="text-slate-900 font-mono tracking-wide">{success.reference}</strong>
          . Please quote it in any correspondence.
        </p>
        <p className="text-slate-600 mb-6" style={sans}>
          {success.confirmationSent ? (
            <>
              We&apos;ve sent a copy of your application to{" "}
              <strong>{success.email}</strong>. If you don&apos;t see it, check
              your spam folder.
            </>
          ) : (
            <>
              We couldn&apos;t send a confirmation email to{" "}
              <strong>{success.email}</strong>, but your application reached our
              team. Keep your reference number for your records.
            </>
          )}
        </p>
        <h3 className="font-bold text-slate-900 mb-3">What happens next</h3>
        <ol className="space-y-2 text-sm text-slate-600 list-decimal pl-5 mb-6" style={sans}>
          <li>Our team reviews your application and may contact you to clarify your scope.</li>
          <li>
            We send you a tailored quotation — typically within{" "}
            <strong>2 business days</strong>.
          </li>
          <li>Once you accept, we agree a plan and kick off your certification project.</li>
        </ol>
        <div className="flex flex-wrap gap-3" style={sans}>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-teal-300 text-teal-800 bg-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors"
          >
            <MessageCircle size={16} aria-hidden="true" /> WhatsApp {whatsappDisplay}
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: TEAL }}
          >
            Back to home <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------------
  // Form
  // ------------------------------------------------------------------------

  const a11y = (name: keyof FormState, hint?: boolean) => {
    const describedBy = errors[name]
      ? errorId(name)
      : hint
        ? `${fieldId(name)}-hint`
        : undefined;
    return {
      id: fieldId(name),
      name,
      "aria-invalid": errors[name] ? (true as const) : undefined,
      "aria-describedby": describedBy,
    };
  };

  const text = (
    name: TextField,
    label: string,
    opts: {
      required?: boolean;
      type?: string;
      autoComplete?: string;
      placeholder?: string;
      hint?: string;
      wide?: boolean;
      inputMode?: "numeric" | "email" | "tel" | "url" | "text";
      min?: number;
    } = {},
  ) => (
    <FieldShell
      name={name}
      label={label}
      required={opts.required}
      hint={opts.hint}
      error={errors[name]}
      wide={opts.wide}
    >
      <input
        {...a11y(name, Boolean(opts.hint))}
        type={opts.type ?? "text"}
        value={form[name]}
        onChange={onText}
        required={opts.required}
        aria-required={opts.required || undefined}
        autoComplete={opts.autoComplete}
        placeholder={opts.placeholder}
        inputMode={opts.inputMode}
        min={opts.min}
        className={inputClass(Boolean(errors[name]))}
        style={sans}
      />
    </FieldShell>
  );

  const textarea = (
    name: TextField,
    label: string,
    opts: { required?: boolean; placeholder?: string; hint?: string; rows?: number } = {},
  ) => (
    <FieldShell
      name={name}
      label={label}
      required={opts.required}
      hint={opts.hint}
      error={errors[name]}
      wide
    >
      <textarea
        {...a11y(name, Boolean(opts.hint))}
        value={form[name]}
        onChange={onText}
        required={opts.required}
        aria-required={opts.required || undefined}
        placeholder={opts.placeholder}
        rows={opts.rows ?? 3}
        className={`${inputClass(Boolean(errors[name]))} resize-y`}
        style={sans}
      />
    </FieldShell>
  );

  const select = (
    name: TextField,
    label: string,
    choices: readonly string[],
    opts: { required?: boolean; wide?: boolean } = {},
  ) => (
    <FieldShell
      name={name}
      label={label}
      required={opts.required}
      error={errors[name]}
      wide={opts.wide}
    >
      <select
        {...a11y(name)}
        value={form[name]}
        onChange={onText}
        required={opts.required}
        aria-required={opts.required || undefined}
        className={inputClass(Boolean(errors[name]))}
        style={sans}
      >
        <option value="">Select…</option>
        {choices.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </FieldShell>
  );

  const multiSite = Number(form.siteCount) > 1;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8" aria-label="ISO certification application">
      {banner && (
        <div
          ref={bannerRef}
          tabIndex={-1}
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-300"
          style={sans}
        >
          <p>{banner.message}</p>
          {banner.network && (
            <p className="mt-1">
              You can also send us your details on{" "}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                WhatsApp ({whatsappDisplay})
              </a>
              .
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500" style={sans}>
        Fields marked <span className="text-teal-700">*</span> are required.
        Your progress is saved in this browser until you submit.
      </p>

      {/* Honeypot — hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor={HONEYPOT_FIELD}>Leave this field empty</label>
        <input
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <Section n={1} title="Contact">
        {text("fullName", "Full name", { required: true, autoComplete: "name" })}
        {text("jobTitle", "Job title", { autoComplete: "organization-title", placeholder: "e.g. Quality Manager" })}
        {text("email", "Work email", { required: true, type: "email", autoComplete: "email", inputMode: "email" })}
        {text("phone", "Phone / WhatsApp", { required: true, type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: "+256 7XX XXXXXX" })}
      </Section>

      <Section n={2} title="Organisation">
        {text("legalName", "Registered (legal) name", { required: true, autoComplete: "organization" })}
        {text("tradingName", "Trading name")}
        {text("address", "Physical address", { required: true, autoComplete: "street-address", wide: true, placeholder: "Plot, street, area" })}
        {text("city", "City / town", { required: true, autoComplete: "address-level2" })}
        {text("country", "Country", { required: true, autoComplete: "country-name" })}
        {text("industry", "Industry / sector", { required: true, placeholder: "e.g. Manufacturing, Fintech, Construction" })}
        {text("website", "Website", { type: "url", inputMode: "url", autoComplete: "url", placeholder: "https://" })}
        {text("registrationNumber", "TIN / company registration no.", { wide: true })}
      </Section>

      <Section n={3} title="Certification scope">
        <div className="sm:col-span-2">
          <fieldset
            aria-describedby={errors.standards ? errorId("standards") : `${fieldId("standards")}-hint`}
          >
            <legend className="block text-sm font-medium text-slate-700 mb-1.5" style={sans}>
              Standards requested
              <span className="text-teal-700" aria-hidden="true"> *</span>
            </legend>
            <div className="flex flex-wrap gap-2" style={sans}>
              {options.standards.map((s, idx) => {
                const checked = form.standards.includes(s);
                return (
                  <label
                    key={s}
                    htmlFor={`${fieldId("standards")}-${idx}`}
                    className={`cursor-pointer select-none inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-500/40 ${
                      checked
                        ? "border-teal-600 bg-teal-50 text-teal-800"
                        : errors.standards
                          ? "border-red-300 bg-white text-slate-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-teal-400"
                    }`}
                  >
                    <input
                      id={`${fieldId("standards")}-${idx}`}
                      type="checkbox"
                      name="standards"
                      value={s}
                      checked={checked}
                      onChange={() => toggleStandard(s)}
                      aria-invalid={errors.standards ? true : undefined}
                      className="h-4 w-4 accent-teal-600"
                    />
                    {s}
                  </label>
                );
              })}
            </div>
            {errors.standards ? (
              <p id={errorId("standards")} className="mt-1 text-xs text-red-600" style={sans}>
                {errors.standards}
              </p>
            ) : (
              <p id={`${fieldId("standards")}-hint`} className="mt-1 text-xs text-slate-500" style={sans}>
                Select all that apply — integrated audits can reduce cost.
              </p>
            )}
          </fieldset>
        </div>
        {form.standards.includes("Other") &&
          text("otherStandard", "Other standard(s)", { required: true, wide: true, placeholder: "e.g. ISO 50001, ISO 37001" })}
        {textarea("scope", "Proposed scope of certification", {
          required: true,
          rows: 4,
          placeholder: "Describe the products, services and activities to be covered, e.g. “Design, manufacture and distribution of bottled drinking water.”",
        })}
        {text("siteCount", "Number of sites / locations", { required: true, type: "number", inputMode: "numeric", min: 1 })}
        <div className="hidden sm:block" aria-hidden="true" />
        {(multiSite || form.siteAddresses) &&
          textarea("siteAddresses", "Addresses of other sites", {
            placeholder: "One site per line, with what happens there and roughly how many staff.",
          })}
        {textarea("outsourcedProcesses", "Outsourced processes", {
          rows: 2,
          placeholder: "e.g. transport, IT hosting, payroll, cleaning",
        })}
      </Section>

      <Section n={4} title="Workforce">
        {text("totalEmployees", "Total employees", {
          required: true,
          type: "number",
          inputMode: "numeric",
          min: 1,
          hint: "Everyone working under the scope, across all sites.",
        })}
        {text("shifts", "Number of shifts", { type: "number", inputMode: "numeric", min: 1 })}
        {text("fullTimeEmployees", "Full-time employees", { type: "number", inputMode: "numeric", min: 0 })}
        {text("partTimeEmployees", "Part-time / temporary", { type: "number", inputMode: "numeric", min: 0 })}
      </Section>

      <Section n={5} title="Current status">
        {select("serviceNeeded", "Service needed", options.services, { required: true })}
        {select("certificationType", "Certification type", options.certificationTypes, { required: true })}
        {select("currentStatus", "Current management system status", options.currentStatuses, { required: true, wide: true })}
        {text("currentCertificationBody", "Existing certification body", { placeholder: "If currently certified or transferring" })}
        {text("targetDate", "Target certification date", { placeholder: "e.g. March 2027" })}
        {text("referralSource", "How did you hear about us?", { wide: true })}
      </Section>

      <Section n={6} title="Anything else">
        {textarea("notes", "Additional notes", {
          rows: 4,
          placeholder: "Deadlines, tender requirements, customer demands, questions…",
        })}
        <div className="sm:col-span-2">
          <div className="flex items-start gap-3" style={sans}>
            <input
              id={fieldId("consent")}
              name="consent"
              type="checkbox"
              checked={form.consent}
              onChange={(e) => {
                const checked = e.target.checked;
                setForm((prev) => ({ ...prev, consent: checked }));
                clearError("consent");
              }}
              required
              aria-required
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? errorId("consent") : undefined}
              className="mt-0.5 h-4 w-4 shrink-0 accent-teal-600"
            />
            <label htmlFor={fieldId("consent")} className="text-sm text-slate-600">
              I agree to be contacted about this application and accept the{" "}
              <Link href="/privacy" target="_blank" className="text-teal-700 underline">
                privacy policy
              </Link>
              .<span className="text-teal-700" aria-hidden="true"> *</span>
            </label>
          </div>
          {errors.consent && (
            <p id={errorId("consent")} className="mt-1 text-xs text-red-600" style={sans}>
              {errors.consent}
            </p>
          )}
        </div>
      </Section>

      <button
        type="submit"
        disabled={submitting}
        aria-disabled={submitting}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white text-sm font-semibold px-8 py-3.5 rounded-lg transition-opacity disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
        style={{ backgroundColor: TEAL, ...sans }}
      >
        {submitting ? (
          "Submitting…"
        ) : (
          <>
            Submit application <ArrowRight size={16} aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
}
