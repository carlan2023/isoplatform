"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { CERTIFICATE_ID_EXAMPLE } from "@/lib/certificates";

const sans = { fontFamily: "var(--font-geist-sans), sans-serif" } as const;

export default function VerifyForm({
  initialId = "",
  initialSurname = "",
}: {
  initialId?: string;
  initialSurname?: string;
}) {
  const router = useRouter();
  const [certificateId, setCertificateId] = useState(initialId);
  const [surname, setSurname] = useState(initialSurname);
  const syncKey = `${initialId}\n${initialSurname}`;
  const [seenKey, setSeenKey] = useState(syncKey);
  if (seenKey !== syncKey) {
    setSeenKey(syncKey);
    setCertificateId(initialId);
    setSurname(initialSurname);
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const id = certificateId.trim();
    if (!id) return;
    const params = new URLSearchParams();
    params.set("id", id);
    const extra = surname.trim();
    if (extra) params.set("surname", extra);
    router.push(`/verify?${params.toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm"
      style={sans}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-700 sm:col-span-2">
          Certificate ID
          <input
            name="certificateId"
            value={certificateId}
            onChange={(event) => setCertificateId(event.target.value)}
            placeholder={CERTIFICATE_ID_EXAMPLE}
            autoComplete="off"
            spellCheck={false}
            required
            maxLength={32}
            className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:border-teal-600"
          />
        </label>
        <label className="block text-sm text-slate-700 sm:col-span-2">
          Surname <span className="text-slate-400">(optional)</span>
          <input
            name="surname"
            value={surname}
            onChange={(event) => setSurname(event.target.value)}
            autoComplete="family-name"
            maxLength={80}
            className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:border-teal-600"
          />
        </label>
      </div>
      <button
        type="submit"
        className="mt-5 inline-flex items-center gap-2 text-white px-4 py-2.5 rounded-md font-medium hover:bg-teal-700"
        style={{ backgroundColor: "#0d9488" }}
      >
        <Search size={16} /> Check certificate
      </button>
    </form>
  );
}
