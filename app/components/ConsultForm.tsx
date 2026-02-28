"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function ConsultForm() {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    standard: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
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
    setLoading(true);
    setError("");
    const res = await fetch("/api/consult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) setSent(true);
    else setError("Something went wrong. Please try again.");
    setLoading(false);
  };

  if (sent)
    return (
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-5 text-center">
        <div
          className="text-teal-700 font-semibold mb-1"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          ✓ Enquiry received
        </div>
        <p
          className="text-teal-600 text-sm"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          We'll be in touch within 24 hours. Check your inbox for a
          confirmation.
        </p>
      </div>
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {[
          { name: "name", placeholder: "Full Name", type: "text" },
          { name: "company", placeholder: "Company", type: "text" },
          { name: "email", placeholder: "Work Email", type: "email" },
          { name: "phone", placeholder: "Phone Number", type: "tel" },
        ].map((f) => (
          <input
            key={f.name}
            name={f.name}
            type={f.type}
            placeholder={f.placeholder}
            value={form[f.name as keyof typeof form]}
            onChange={handleChange}
            required={f.name !== "phone"}
            className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 bg-white"
            style={{ fontFamily: "system-ui, sans-serif" }}
          />
        ))}
      </div>
      <select
        name="standard"
        value={form.standard}
        onChange={handleChange}
        required
        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 bg-white"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        <option value="">Which ISO standard are you pursuing?</option>
        <option>ISO 9001 — Quality Management</option>
        <option>ISO 14001 — Environmental Management</option>
        <option>ISO 45001 — Occupational Health & Safety</option>
        <option>ISO 22000 — Food Safety</option>
        <option>Multiple standards</option>
        <option>Not sure yet</option>
      </select>
      <textarea
        name="message"
        placeholder="Tell us briefly about your organisation and where you are in the certification journey..."
        value={form.message}
        onChange={handleChange}
        required
        rows={3}
        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 bg-white resize-none"
        style={{ fontFamily: "system-ui, sans-serif" }}
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 text-white text-sm font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
        style={{
          backgroundColor: "#0d9488",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {loading ? (
          "Sending..."
        ) : (
          <>
            {" "}
            Send Enquiry <ArrowRight size={15} />{" "}
          </>
        )}
      </button>
    </form>
  );
}
