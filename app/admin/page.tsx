"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Users,
  LogOut,
  CheckCircle,
  XCircle,
  Wallet,
  Clock,
  Search,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { formatUGX } from "@/lib/pricing";

type AdminEnrollment = {
  id: string;
  status: string;
  amount_paid: number | null;
  enrolled_at: string | null;
  reference: string | null;
  course: {
    id?: string | null;
    title: string | null;
    standard: string | null;
    start_date: string | null;
  } | null;
  learner: {
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
  };
};

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  confirmed: { cls: "bg-green-100 text-green-700", label: "Confirmed" },
  awaiting_confirmation: {
    cls: "bg-blue-100 text-blue-700",
    label: "Awaiting confirmation",
  },
  cancelled: { cls: "bg-red-100 text-red-600", label: "Cancelled" },
  pending: { cls: "bg-amber-100 text-amber-700", label: "Awaiting payment" },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "awaiting_confirmation", label: "Awaiting confirmation" },
  { id: "confirmed", label: "Confirmed" },
  { id: "pending", label: "Awaiting payment" },
  { id: "cancelled", label: "Cancelled" },
] as const;

const sans = { fontFamily: "system-ui, sans-serif" as const };

export default function AdminPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<AdminEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
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

      const res = await fetch("/api/admin/enrollments");
      if (res.ok) {
        const data = await res.json();
        setEnrollments((data.enrollments ?? []) as AdminEnrollment[]);
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const stats = useMemo(() => {
    const active = enrollments.filter((e) => e.status !== "cancelled");
    return {
      total: enrollments.length,
      awaiting: enrollments.filter((e) => e.status === "awaiting_confirmation")
        .length,
      confirmed: enrollments.filter((e) => e.status === "confirmed").length,
      pending: enrollments.filter((e) => e.status === "pending").length,
      revenue: active
        .filter(
          (e) =>
            e.status === "confirmed" || e.status === "awaiting_confirmation",
        )
        .reduce((sum, e) => sum + (e.amount_paid || 0), 0),
    };
  }, [enrollments]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enrollments
      .filter((e) => filter === "all" || e.status === filter)
      .filter((e) => {
        if (!q) return true;
        return [
          e.learner.name,
          e.learner.email,
          e.learner.company,
          e.course?.title,
          e.course?.standard,
          e.reference,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      });
  }, [enrollments, filter, query]);

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    const res = await fetch("/api/admin/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollmentId: id, status }),
    });
    setBusyId("");
    if (!res.ok) {
      alert("Could not update enrollment. Please try again.");
      return;
    }
    setEnrollments((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e)),
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin" style={{ color: "#0d9488" }} />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-sm flex items-center justify-center"
            style={{ backgroundColor: "#0d9488" }}
          >
            <ShieldCheck size={15} className="text-white" />
          </div>
          <span className="font-bold text-slate-900">
            AM Quality Management Systems
          </span>
          <span
            className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-1"
            style={sans}
          >
            Admin
          </span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-red-500 transition-colors"
          style={sans}
        >
          <LogOut size={14} /> Sign out
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Enrollment management
        </h1>
        <p className="text-slate-500 text-sm mb-8" style={sans}>
          Review payments, confirm seats, and manage every enrollment.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: <Users size={18} className="text-teal-600" />,
              value: stats.total,
              label: "Total enrollments",
            },
            {
              icon: <Clock size={18} className="text-blue-600" />,
              value: stats.awaiting,
              label: "Awaiting confirmation",
            },
            {
              icon: <CheckCircle size={18} className="text-green-600" />,
              value: stats.confirmed,
              label: "Confirmed",
            },
            {
              icon: <Wallet size={18} className="text-teal-600" />,
              value: formatUGX(stats.revenue),
              label: "Collected",
              small: true,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white border border-slate-200 rounded-xl p-5"
            >
              <div className="mb-3">{s.icon}</div>
              <div
                className={`font-bold text-slate-900 ${s.small ? "text-lg" : "text-2xl"}`}
              >
                {s.value}
              </div>
              <div className="text-xs text-slate-400 mt-0.5" style={sans}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filters + search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const count =
                f.id === "all"
                  ? enrollments.length
                  : enrollments.filter((e) => e.status === f.id).length;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
                  style={
                    filter === f.id
                      ? { backgroundColor: "#0d9488", color: "white", borderColor: "#0d9488", ...sans }
                      : { backgroundColor: "white", color: "#64748b", borderColor: "#e2e8f0", ...sans }
                  }
                >
                  {f.label} ({count})
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-2.5 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, course…"
              className="border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:border-teal-500"
              style={sans}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={sans}>
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Learner", "Course", "Start", "Amount", "Status", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {visible.map((e) => {
                  const badge = STATUS_BADGE[e.status] ?? STATUS_BADGE.pending;
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors align-top"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {e.learner.name || "—"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {e.learner.email || "no email"}
                        </div>
                        {e.learner.company && (
                          <div className="text-xs text-slate-400">
                            {e.learner.company}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {e.course?.title || "—"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {e.course?.standard}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {e.course?.start_date
                          ? new Date(e.course.start_date).toLocaleDateString(
                              "en-GB",
                              { day: "numeric", month: "short", year: "numeric" },
                            )
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        <div>{formatUGX(Number(e.amount_paid || 0))}</div>
                        {e.reference && (
                          <div className="text-xs text-slate-300 font-mono">
                            {e.reference}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {busyId === e.id ? (
                            <Loader2
                              size={14}
                              className="animate-spin text-slate-400"
                            />
                          ) : (
                            <>
                              {e.status !== "confirmed" && (
                                <button
                                  onClick={() =>
                                    updateStatus(e.id, "confirmed")
                                  }
                                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium whitespace-nowrap"
                                >
                                  <CheckCircle size={13} /> Confirm
                                </button>
                              )}
                              {e.status !== "cancelled" && (
                                <button
                                  onClick={() =>
                                    updateStatus(e.id, "cancelled")
                                  }
                                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500 font-medium whitespace-nowrap"
                                >
                                  <XCircle size={13} /> Cancel
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      No enrollments match this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
