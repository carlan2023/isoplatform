"use client";
import { useId, useState } from "react";
import { ArrowRight } from "lucide-react";

export default function ConsultForm({
  defaultStandard = "",
}: {
  /** Preselect the standard dropdown (e.g. from a certification landing page). */
  defaultStandard?: string;
}) {
  const uid = useId();
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    standard: defaultStandard,
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        note?: string;
      };
      if (res.ok) {
        setNote(data.note ?? "");
        setSent(true);
      } else {
        setError(
          data.error || "Something went wrong. Please try again or use WhatsApp.",
        );
      }
    } catch (err) {
      console.error("[consult] submit failed:", err);
      setError(
        "Network error — please check your connection and try again, or message us on WhatsApp.",
      );
    } finally {
      setLoading(false);
    }
  };

  const sans = { fontFamily: "system-ui, sans-serif" };
  const inputCls =
    "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white";
  const errorId = `${uid}-error`;

  if (sent)
    return (
      <div
        className="bg-teal-50 border border-teal-200 rounded-lg p-5 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="text-teal-700 font-semibold mb-1" style={sans}>
          ✓ Enquiry received
        </div>
        <p className="text-teal-600 text-sm" style={sans}>
          {note ||
            "We'll be in touch within 24 hours. Check your inbox for a confirmation."}
        </p>
      </div>
    );

  const fields = [
    { name: "name", label: "Full name", placeholder: "Full Name", type: "text", autoComplete: "name", required: true },
    { name: "company", label: "Company", placeholder: "Company", type: "text", autoComplete: "organization", required: true },
    { name: "email", label: "Work email", placeholder: "Work Email", type: "email", autoComplete: "email", required: true },
    { name: "phone", label: "Phone number (optional)", placeholder: "Phone Number", type: "tel", autoComplete: "tel", required: false },
  ] as const;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3"
      aria-describedby={error ? errorId : undefined}
    >
      {error && (
        <div
          id={errorId}
          role="alert"
          className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3"
          style={sans}
        >
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.name}>
            <label htmlFor={`${uid}-${f.name}`} className="sr-only">
              {f.label}
            </label>
            <input
              id={`${uid}-${f.name}`}
              name={f.name}
              type={f.type}
              placeholder={f.placeholder}
              autoComplete={f.autoComplete}
              value={form[f.name]}
              onChange={handleChange}
              required={f.required}
              maxLength={f.name === "email" ? 254 : f.name === "phone" ? 30 : 160}
              className={inputCls}
              style={sans}
            />
          </div>
        ))}
      </div>
      <label htmlFor={`${uid}-standard`} className="sr-only">
        Which standard are you pursuing?
      </label>
      <select
        id={`${uid}-standard`}
        name="standard"
        value={form.standard}
        onChange={handleChange}
        required
        className={inputCls}
        style={sans}
      >
        <option value="">Which standard are you pursuing?</option>
        <optgroup label="Management systems">
          <option>ISO 9001 — Quality Management</option>
          <option>ISO 14001 — Environmental Management</option>
          <option>ISO 45001 — Occupational Health & Safety</option>
          <option>ISO 22000 — Food Safety</option>
        </optgroup>
        <optgroup label="Information security & data protection">
          <option>ISO 27001 — Information Security</option>
          <option>ISO 27701 — Privacy Information Management</option>
          <option>PCI DSS — Payment Card Security</option>
        </optgroup>
        <option>Multiple standards</option>
        <option>Not sure yet</option>
      </select>
      <label htmlFor={`${uid}-message`} className="sr-only">
        Message
      </label>
      <textarea
        id={`${uid}-message`}
        name="message"
        placeholder="Tell us briefly about your organisation and where you are in the certification journey..."
        value={form.message}
        onChange={handleChange}
        required
        maxLength={5000}
        rows={3}
        className={`${inputCls} resize-none`}
        style={sans}
      />
      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="w-full flex items-center justify-center gap-2 text-white text-sm font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
        style={{ backgroundColor: "#0d9488", ...sans }}
      >
        {loading ? (
          "Sending..."
        ) : (
          <>
            Send Enquiry <ArrowRight size={15} aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
}
