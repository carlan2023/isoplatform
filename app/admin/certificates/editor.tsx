"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Loader2,
  LogOut,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  CERTIFICATE_CSV_TEMPLATE,
  CERTIFICATE_DISCLAIMER,
  CERTIFICATE_ID_EXAMPLE,
  formatCertificateDate,
  isDemoCertificateId,
  type CertificateRecord,
  type CertificateStatus,
  type CourseCode,
} from "@/lib/certificates";

const sans = { fontFamily: "var(--font-geist-sans), sans-serif" as const };

type FormState = {
  originalCertificateId: string;
  certificateId: string;
  holderFullName: string;
  course: string;
  trainingStart: string;
  trainingEnd: string;
  issueDate: string;
  status: CertificateStatus;
};

const EMPTY: FormState = {
  originalCertificateId: "",
  certificateId: "",
  holderFullName: "",
  course: "",
  trainingStart: "",
  trainingEnd: "",
  issueDate: "",
  status: "valid",
};

export default function CertificateEditor({ demoUnlocked }: { demoUnlocked: boolean }) {
  const router = useRouter();
  const [rows, setRows] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignYear, setAssignYear] = useState("2026");
  const [assignCode, setAssignCode] = useState<CourseCode>("LA");
  const [csvErrors, setCsvErrors] = useState<{ row: number; error: string }[]>([]);

  const load = async () => {
    const res = await fetch("/api/admin/certificates");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not load certificates.");
      setRows([]);
      return;
    }
    setError("");
    setRows((data.certificates ?? []) as CertificateRecord[]);
  };

  useEffect(() => {
    const start = async () => {
      if (!demoUnlocked) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login?redirect=/admin/certificates");
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile?.role !== "admin") {
          router.push("/dashboard");
          return;
        }
      }
      try {
        await load();
      } catch (e) {
        console.error("[admin/certificates] load failed:", e);
        setError("Could not load certificates. Reload to retry.");
      }
      setLoading(false);
    };
    start().catch((e) => {
      console.error("[admin/certificates] load failed:", e);
      setError("Could not load certificates. Reload to retry.");
      setLoading(false);
    });
  }, [demoUnlocked, router]);

  const counts = useMemo(
    () => ({
      total: rows.length,
      valid: rows.filter((row) => row.status === "valid").length,
      revoked: rows.filter((row) => row.status === "revoked").length,
    }),
    [rows],
  );
  const hasDemo = rows.some((row) => isDemoCertificateId(row.certificateId));

  const onField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const assignNext = async () => {
    setAssigning(true);
    setError("");
    setNotice("");
    let res: Response;
    try {
      res = await fetch("/api/admin/certificates/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: Number(assignYear), courseCode: assignCode }),
      });
    } catch (e) {
      console.error("[admin/certificates] assign failed:", e);
      setAssigning(false);
      setError("Network error. Please try again.");
      return;
    }
    const data = await res.json().catch(() => ({}));
    setAssigning(false);
    if (!res.ok || typeof data.certificateId !== "string") {
      setError(data.error || "Could not assign a certificate number.");
      return;
    }
    onField("certificateId", data.certificateId);
    setNotice(`Assigned ${data.certificateId}.`);
  };

  const save = async () => {
    setSaving(true);
    setNotice("");
    setError("");
    const creating = !form.originalCertificateId;
    let res: Response;
    try {
      res = await fetch("/api/admin/certificates", {
        method: creating ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch (e) {
      console.error("[admin/certificates] save failed:", e);
      setSaving(false);
      setError("Network error. Please try again.");
      return;
    }
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save the certificate.");
      return;
    }
    setForm(EMPTY);
    setNotice(creating ? "Certificate added." : "Certificate updated.");
    await load();
  };

  const edit = (row: CertificateRecord) => {
    setForm({
      originalCertificateId: row.certificateId,
      certificateId: row.certificateId,
      holderFullName: row.holderFullName,
      course: row.course,
      trainingStart: row.trainingStart,
      trainingEnd: row.trainingEnd,
      issueDate: row.issueDate,
      status: row.status,
    });
    document.getElementById("certificate-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const setStatus = async (row: CertificateRecord, status: CertificateStatus) => {
    setError("");
    setNotice("");
    const res = await fetch("/api/admin/certificates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...row, originalCertificateId: row.certificateId, status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not update the certificate.");
      return;
    }
    setNotice(status === "revoked" ? "Certificate revoked." : "Certificate marked valid.");
    await load();
  };

  const importCsv = async (file: File) => {
    setCsvErrors([]);
    setError("");
    setNotice("");
    const csv = await file.text();
    const res = await fetch("/api/admin/certificates/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setCsvErrors(data.errors ?? []);
      setError(data.error || "Could not import the file.");
      return;
    }
    setNotice(`Imported ${data.inserted} new and updated ${data.updated}.`);
    await load();
  };

  const removeDemo = async () => {
    setError("");
    const res = await fetch("/api/admin/certificates/remove-demo", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not remove the sample certificates.");
      return;
    }
    setNotice(`Removed ${data.deleted} sample certificate${data.deleted === 1 ? "" : "s"}.`);
    await load();
  };

  const downloadTemplate = () => {
    const blob = new Blob([CERTIFICATE_CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nam-qms-certificates-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin" style={{ color: "#0d9488" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-sm flex items-center justify-center"
            style={{ backgroundColor: "#0d9488" }}
          >
            <ShieldCheck size={15} className="text-white" />
          </div>
          <span className="font-bold text-slate-900">NAM Quality Management Systems</span>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-1" style={sans}>
            Admin
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm text-slate-600 hover:text-teal-700" style={sans}>
            Enrollments
          </Link>
          {demoUnlocked ? (
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-600" style={sans}>
              Home
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-red-500 transition-colors"
              style={sans}
            >
              <LogOut size={14} /> Sign out
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10" style={sans}>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Certificates of completion</h1>
        <p className="text-slate-500 text-sm mb-6 max-w-3xl">{CERTIFICATE_DISCLAIMER}</p>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}
        {notice && (
          <div className="bg-teal-50 border border-teal-200 text-teal-800 text-sm rounded-lg px-4 py-3 mb-4">
            {notice}
          </div>
        )}
        {hasDemo && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-lg px-4 py-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p>
              Sample rows for this preview use holder Sample Holder. Remove them before launch.
            </p>
            <button
              type="button"
              onClick={removeDemo}
              className="text-xs font-medium px-3 py-1.5 rounded-md border border-amber-300 bg-white hover:bg-amber-100"
            >
              Remove sample certificates
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            ["Total", counts.total],
            ["Valid", counts.valid],
            ["Revoked", counts.revoked],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Certificate", "Holder", "Course", "Training", "Issued", "Status", "Actions"].map((heading) => (
                    <th
                      key={heading}
                      className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide whitespace-nowrap"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 align-top">
                    <td className="px-4 py-4 font-mono text-xs text-slate-700">{row.certificateId}</td>
                    <td className="px-4 py-4 text-slate-900">{row.holderFullName}</td>
                    <td className="px-4 py-4 text-slate-700">{row.course}</td>
                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                      {formatCertificateDate(row.trainingStart)} – {formatCertificateDate(row.trainingEnd)}
                    </td>
                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                      {formatCertificateDate(row.issueDate)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full ${
                          row.status === "valid"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {row.status === "valid" ? "Valid" : "Revoked"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-3 text-xs font-medium">
                        <button type="button" onClick={() => edit(row)} className="text-teal-700 hover:text-teal-800">
                          Edit
                        </button>
                        {row.status === "valid" ? (
                          <button
                            type="button"
                            onClick={() => setStatus(row, "revoked")}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            <XCircle size={13} /> Revoke
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setStatus(row, "valid")}
                            className="inline-flex items-center gap-1 text-green-700 hover:text-green-800"
                          >
                            <CheckCircle size={13} /> Restore
                          </button>
                        )}
                        <a
                          className="text-slate-600 hover:text-slate-900"
                          href={`/api/admin/certificates/qr?certificateId=${encodeURIComponent(row.certificateId)}&format=png`}
                        >
                          PNG
                        </a>
                        <a
                          className="text-slate-600 hover:text-slate-900"
                          href={`/api/admin/certificates/qr?certificateId=${encodeURIComponent(row.certificateId)}&format=svg`}
                        >
                          SVG
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      No certificates yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <form
          id="certificate-form"
          className="bg-white border border-slate-200 rounded-xl p-6 mb-8"
          onSubmit={(event) => {
            event.preventDefault();
            save().catch((e) => {
              console.error(e);
              setError("Could not save the certificate.");
              setSaving(false);
            });
          }}
        >
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            {form.originalCertificateId ? "Edit certificate" : "Add a certificate"}
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <label className="block text-sm text-slate-700">
              Year
              <input
                type="number"
                min={2000}
                max={2099}
                value={assignYear}
                onChange={(event) => setAssignYear(event.target.value)}
                className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm text-slate-700">
              Course code
              <select
                value={assignCode}
                onChange={(event) => setAssignCode(event.target.value as CourseCode)}
                className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="LA">LA — Lead Auditor</option>
                <option value="IA">IA — Internal Auditor</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            disabled={assigning}
            onClick={() => {
              assignNext().catch((e) => {
                console.error(e);
                setError("Could not assign a certificate number.");
                setAssigning(false);
              });
            }}
            className="text-sm font-medium text-teal-700 mb-4 disabled:opacity-60"
          >
            {assigning ? "Assigning…" : "Assign next number"}
          </button>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Certificate ID" value={form.certificateId} onChange={(value) => onField("certificateId", value)} placeholder={CERTIFICATE_ID_EXAMPLE} />
            <Field label="Holder full name" value={form.holderFullName} onChange={(value) => onField("holderFullName", value)} />
            <Field label="Course" value={form.course} onChange={(value) => onField("course", value)} placeholder="ISO 9001 Lead Auditor" />
            <label className="block text-sm text-slate-700">
              Status
              <select
                value={form.status}
                onChange={(event) => onField("status", event.target.value)}
                className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="valid">Valid</option>
                <option value="revoked">Revoked</option>
              </select>
            </label>
            <Field label="Training start" value={form.trainingStart} onChange={(value) => onField("trainingStart", value)} type="date" />
            <Field label="Training end" value={form.trainingEnd} onChange={(value) => onField("trainingEnd", value)} type="date" />
            <Field label="Issue date" value={form.issueDate} onChange={(value) => onField("issueDate", value)} type="date" />
          </div>
          <div className="flex gap-3 mt-5">
            <button
              type="submit"
              disabled={saving}
              className="text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-60"
              style={{ backgroundColor: "#0d9488" }}
            >
              {saving ? "Saving…" : form.originalCertificateId ? "Save changes" : "Add certificate"}
            </button>
            {form.originalCertificateId && (
              <button type="button" onClick={() => setForm(EMPTY)} className="text-sm text-slate-500 px-3 py-2">
                Cancel
              </button>
            )}
          </div>
        </form>

        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Import CSV</h2>
          <p className="text-sm text-slate-500 mb-4">
            Columns: certificate_id, holder_full_name, course, training_start, training_end, issue_date, status.
            Dates use YYYY-MM-DD. Status is valid or revoked. An existing certificate ID is updated.
            Certificate numbers look like {CERTIFICATE_ID_EXAMPLE}. Capitalisation is ignored. Spaces and hyphens are removed. The check letter must match.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".csv,text/csv"
              aria-label="Certificate CSV"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) {
                  importCsv(file).catch((e) => {
                    console.error(e);
                    setError("Could not read that file.");
                  });
                }
              }}
              className="text-sm"
            />
            <button type="button" onClick={downloadTemplate} className="text-sm text-teal-700 font-medium">
              Download template
            </button>
          </div>
          {csvErrors.length > 0 && (
            <ul className="mt-4 text-sm text-red-700 space-y-1">
              {csvErrors.map((item) => (
                <li key={`${item.row}-${item.error}`}>
                  Row {item.row}: {item.error}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block text-sm text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-600"
      />
    </label>
  );
}
